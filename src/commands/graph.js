/*
 * Copyright 2019 Cognitive Scale, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const _ = require('lodash');
const debug = require('debug')('cortex:cli:graph');
const split = require('split');
const fs = require('fs');
const Table = require('tty-table');
const ProgressBar = require('progress');
const jp = require('jsonpath');
const path = require('path');
const { loadProfile } = require('../config');
const { Graph } = require('../client/graph');
const { printSuccess, printError, filterObject, countLinesInFile, printTable } = require('./utils');


const _reserved = ['$match', '$path', '$transform', '$name'];
const _systemEvents = ['$set', '$unset', '$delete'];
const applyTemplate = (t, target) => {
    const { $match, $path, $transform, $name } = t;

    debug('applying template to target:', target);

    // Match condition, if specified, this must eval to true, otherwise the template is skipped
    if ($match) {
        debug(`checking $match for ${$name}: ${$match}`);
        let match = true;
        const queryTarget = [target];
        for (let m of $match) {
            const paths = jp.query(queryTarget, m);
            match = paths && paths.length > 0;
        }

        if (!match) return null;
        if ($name) debug(`Matched template ${$name}: ${$match}`);
    }

    // A custom transformation, expecting $path + $transform where $transform is a function taking a single param
    if ($path) {
        const val = jp.value(target, $path);
        if ($transform) return $transform(val);
        return val;
    }

    const result = {};
    const keys = Object.keys(t);
    keys.forEach((k) => {
        // Skip over reserved keys
        if (_reserved.indexOf(k) !== -1) return;

        const q = t[k];
        debug('q:', q);

        // Hardcoded event using a system event type
        if (k == 'event' && _systemEvents.indexOf(q) !== -1) {
            result[k] = q;
            return;
        }

        if (_.isObject(q)) {
            result[k] = applyTemplate(q, target);
        }
        else if (q.startsWith('$')) {
            result[k] = jp.value(target, q);
        }
        else {
            result[k] = q;
        }
    });

    return result;
};

const fixUnicodeKeys = (obj) => {
    const keys = Object.keys(obj);
    const result = {};
    keys.forEach((k) => {
        const newKey = k.replace(/\\u002e/, '_').replace(/@/, '_');
        result[newKey] = obj[k];
    });
    return result;
};

/**
 * Automatically generate attribute events for system events (e.g. $set)
 * @param {object} evt
 */
const autoAttributes = (evt) => {
    let attrs = [];

    // Skip relationship events
    if (evt.targetEntityId) return attrs;

    const { event, properties, entityId, entityType, eventTime, source, meta, eventLabel } = evt;

    if (event == '$set') {
        attrs = Object.keys(properties).map((k) => ({
            event: k,
            entityId,
            entityType,
            eventTime,
            source,
            meta,
            eventLabel,
            properties: {
                value: properties[k]
            }
        }));
    }

    return attrs;
};

class FindEventsCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeFindEvents()', profile.name);

        const graph = new Graph(profile.url);
        graph.findEvents(profile.token, options.filter, options.sort, options.limit, options.skip)
            .then((response) => {
                if (response.success) {
                    let result = response.events;
                    if (options.query)
                        result = filterObject(result, options);

                    if (options.json) {
                        printSuccess(JSON.stringify(result, null, 2), options);
                    }
                    else {
                        const tableSpec = [
                            {column: 'Entity ID', field: 'entityId', width: 40},
                            {column: 'Entity Type', field: 'entityType', width: 30},
                            {column: 'Event', field: 'event', width: 30},
                            {column: 'Event Label', field: 'eventLabel', width: 30},
                            {column: 'Event Time', field: 'eventTime', width: 20},
                        ];

                        printTable(tableSpec, result);
                    }
                }
                else {
                    printError(`Failed to find entities: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to find entities: ${err.status} ${err.message}`, options);
            });
    }
}

class PublishEventsCommand {
    constructor(program) {
        this.program = program;
    }

    execute(file, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executePublishEvents()', profile.name);

        const graph = new Graph(profile.url);
        let eventCount = 0;
        const errors = [];

        const publishEvent = async (event, bar) => {
            if (!event) return;

            debug('publishing event: ', event);
            eventCount++;

            let rs;
            if (options.tracking) {
                rs = await graph.track(profile.token, event);
            }
            else {
                rs = await graph.publishEntities(profile.token, event);
            }

            if (!rs.success) errors.push(rs.message);
            if (bar) bar.tick();
        };

        const printEvent = (event, bar) => {
            if (!event) return;

            eventCount++;

            console.log(JSON.stringify(event));
        };

        const processStream = (stream, resolve, reject, bar) => {
            const tasks = [];
            stream.pipe(split())
                .on('data', (line) => {
                    if (_.isEmpty(line)) return;

                    const obj = JSON.parse(line);
                    let events = [obj];

                    if (options.transform) {
                        debug('loading templates from: ', path.resolve(options.transform));
                        const templates = require(path.resolve(options.transform));
                        debug('loaded templates:', templates);
                        events = templates.map((t) => applyTemplate(t, obj)).filter(e => e !== null);
                    }

                    if (options.auto) {
                        const autoAttrs = _.flatten(events.map((evt) => autoAttributes(evt)));
                        debug(`Generated ${autoAttrs.length} attribute events`);
                        events = events.concat(autoAttrs);
                    }

                    debug('# events to publish:', events.length);

                    let task = publishEvent;
                    if (options.dryRun) {
                        task = printEvent;
                    }

                    events.forEach((e) => tasks.push(task(e, bar)));
                })
                .on('error', (err) => reject(err))
                .on('end', () => Promise.all(tasks).then(() => {
                    printSuccess(`Processed ${eventCount} events with ${errors.length} errors`);
                    if (errors.length > 0) {
                        printError(`First error: ${errors[0]}`, options, false);
                    }
                    resolve({ eventCount, errors });
                }).catch(err => reject(err)));
        };

        if (file) {
            return countLinesInFile(file)
                .then((numLines) => {
                    printSuccess(`Publishing ${numLines} lines from file ${file}`);
                    const bar = new ProgressBar(
                        'publishing [:bar] :current/:total :rate evt/s :elapsed s',
                        { total: numLines, width: 65 }
                    );

                    return new Promise((resolve, reject) => {
                        const stream = fs.createReadStream(file);
                        processStream(stream, resolve, reject, bar);
                    });
                });
        }
        else {
            return new Promise((resolve, reject) => {
                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                processStream(process.stdin, resolve, reject);
            });
        }
    }
}

class GetEntityCommand {

    constructor(program) {
        this.program = program;
    }

    execute(entityId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeGetEntity(%s)', profile.name, entityId);

        const graph = new Graph(profile.url);
        graph.getEntity(profile.token, entityId)
            .then((response) => {
                if (response.success) {
                    let result = response.entity;
                    if (options.query)
                        result = filterObject(result, options);

                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    printError(`Failed to get entity: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to get entity: ${err.status} ${err.message}`, options);
            });
    }
}

class QueryGraphCommand {

    constructor(program) {
        this.program = program;
    }

    execute(query, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeQueryGraph(%s)', profile.name, query);

        const graph = new Graph(profile.url);
        graph.query(profile.token, query)
            .then((response) => {
                if (response.success) {
                    const result = response.result;
                    const rows = result.values || [];

                    debug('query result:', result);

                    if (options.json) {
                        printSuccess(JSON.stringify(result, null, 2), options);
                    }
                    else {
                        const table = new Table(
                            result.columns.map(c => ({ value: c, headerColor : 'cyan', })), 
                            rows,
                            { defaultValue: '---'});
                        
                        printSuccess(query);
                        console.log(table.render());
                        console.log();
                        printSuccess(`Found ${rows.length} results in ${result.took} milliseconds`, options); 
                    }
                }
                else {
                    printError(`Failed to execute query: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                debug(err);
                printError(`Failed to execute query: ${err.status} ${err.message}`, options);
            });
    }
}

module.exports = {
    FindEventsCommand,
    PublishEventsCommand,
    GetEntityCommand,
    QueryGraphCommand,
};
