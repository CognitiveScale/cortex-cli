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
const through2 = require('through2');

const { loadProfile } = require('../config');
const { Graph } = require('../client/graph');
const { printSuccess, printError, filterObject, countLinesInFile, printTable } = require('./utils');


const _reserved = ['$match', '$path', '$transform', '$name'];
const _systemEvents = ['$set', '$unset', '$delete'];
const progressBarConfig = 'publishing [:bar] :current/:total :rate evt/s :elapsed s' ;

const applyTemplate = (t, target) => {
    const { $match, $path, $transform, $name } = t;

    debug(`applying template to target: ${JSON.stringify(target, null, 4)}`);

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

function castValue(value) {
    if (_.isNumber(value) || _.isString(value) || _.isBoolean(value)) {
        return { value };
    }
    if (_.isArray(value)) {
        return {
            value: _.map(value, (x) => _.isString(x) ? castValue(x) : x)
        };

    }
    // Construct Dimensional from Object
    if (_.isObject(value)) {
        return {
            value: _.map(
                _.entries(value), 
                entry => {
                    const [k, v] = entry;
                    return { 
                        dimensionId: k,
                        dimensionValue: castValue(v),
                    };
                }
            )
        }
    }
}

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
            properties: castValue(properties[k]),
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
        graph.findEvents(options.project || profile.project, profile.token, options.filter, options.sort, options.limit, options.skip)
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
        // Multiple Event Transformers can be specified in the same file ...
        const lineCountIsDynamic = (options.transform || options.auto || _.isEmpty(file));

        const publishEvent = async (events, bar) => {
            if (_.isEmpty(events)) return;

            debug(`publishing ${_.size(events)} events`);
            debug(`publishing events: ${JSON.stringify(events)}`);
            
            let rs;

            if (options.tracking) {
                rs = await graph.track(options.project || profile.project, profile.token, events);
            }
            else {
                rs = await graph.publishEntities(options.project || profile.project, profile.token, events);
            }

            if (bar && events.length > 0) bar.tick(events.length);

            if (!rs.success) {
                throw Error(rs.message);
            }
        };

        // Git conflict - this was not async before ...
        const printEvent = async (events, bar) => {
            if (!events) return;
            events.forEach((e) => console.log(JSON.stringify(e)));
        };

        function list_can_handle_element_without_going_over_size(batch_size, element_size, max_size) {
            const batch_size_delta_if_elem_added = element_size + (batch_size > 2 ? 1 : 0); // 1 for the , if not empty
            return batch_size + batch_size_delta_if_elem_added <= max_size
        }
        
        function batchElementsUntilSize(max_size) {
            let batch = [];
            let batch_size = JSON.stringify(batch).length;

            function handler(event, encoding, callback) {
                const max_event_size = max_size - 2; // Handling []
                const event_size = JSON.stringify(event).length;
                
                if (event_size > max_event_size) {
                    debug(`Event too large at ${event_size}B. Max Size: ${max_event_size}B. Event: ${JSON.stringify(event)}`);
                }
                else if (list_can_handle_element_without_going_over_size(batch_size, event_size, max_size)) {
                    batch.push(event);
                    batch_size += event_size + (batch_size > 2 ? 1 : 0);  // 1 for the , if not empty []
                }
                else {
                    debug(`LIMIT REACHED ${batch_size}, PUSHING ${batch.length} elements.`);
                    this.push(batch);
                    batch = [];
                    batch_size = JSON.stringify(batch).length;
                }
                callback();
            }

            function flusher(callback) {
                if (!_.isEmpty(batch)) {
                    this.push(batch);
                    batch = [];
                    batch_size = JSON.stringify(batch).length;
                }
                callback();
            }
            return {
                batchHandler: handler,
                batchFlusher: flusher,
            };
        }

        const processStream = (stream, resolve, reject, bar) => {
            // Moved here ... we dont know how many events are being pushed ... even if a file is specified ...
            bar = !_.isEmpty(bar) ? bar : (
                new ProgressBar(progressBarConfig, { total: 0, width: 65 })
            );
            const { batchHandler, batchFlusher, } = batchElementsUntilSize(1024 * 100);
            stream
                .pipe(split())
                // Cast to JSONs
                .pipe(through2.obj(
                    function (line, encoding, callback){
                        if (!_.isEmpty(line)) {
                            this.push(JSON.parse(line));    
                        } 
                        callback();
                    }
                ))
                // Transform and Expand Auto Attributes ...
                .pipe(through2.obj(
                    function (event, encoding, callback) {
                        let events = [event];
                        
                        if (options.transform) {
                            debug('loading templates from: ', path.resolve(options.transform));
                            const templates = require(path.resolve(options.transform));
                            debug('loaded templates:', templates);
                            // The event gets completely replaced in this case ... since we are saying it needs to be
                            // transformed ... thats why concat is not used here ...
                            events = _.map(
                                templates,
                                (t) => applyTemplate(t, event),
                            ).filter(e => e !== null);
                        }
                        
                        if (options.auto) {
                            const autoAttrs = _.flatten(events.map((evt) => autoAttributes(evt)));
                            debug(`Generated ${autoAttrs.length} attribute events`);
                            events = events.concat(autoAttrs);
                        }
                        events.forEach((e) => this.push(e));
                        callback();
                    }
                ))
                // Batch Based on Size
                .pipe(through2({ objectMode: true }, batchHandler, batchFlusher))
                .pipe(through2(
                    // Only upload 1 batch at a time!
                    { objectMode: true, highWaterMark: 5 }, 
                    function (batch_of_events_to_upload, encoding, callback) {
                        if (lineCountIsDynamic){
                            bar.total += _.size(batch_of_events_to_upload);
                        }
                        let task = options.dryRun ? printEvent : publishEvent;
                        task(batch_of_events_to_upload, bar)
                            .then((response) => {
                                this.push(response);
                                callback();
                            })
                            .catch((error) => {
                                printError(`Error uploading event batch: ${error.message}`, options, false);
                                callback();
                            });
                    }
                ))
                .on('data', (response_from_batch_publish) => {
                    debug(`# Response from events published : ${response_from_batch_publish}`);
                })
                .on('error', (err) => reject(err))
                .on('end', () => {
                    if(!options.dryRun) {
                        printError(`Finished processing ${bar.total} events in batches.`, null, false);
                    }
                    bar.terminate();
                    resolve({ eventCount: bar.total });
                });
        };

        if (file) {
            return countLinesInFile(file)
                .then((numLines) => {
                    let bar = null;
                    if (!lineCountIsDynamic) {
                        bar = new ProgressBar(
                            progressBarConfig, { total: numLines, width: 65 }
                        );
                        printError(`Publishing ${numLines} records from file ${file}`, null, false);
                    } else {
                        printError(`Publishing ??????????? records from file ${file}`, null, false);
                    }
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
        graph.getEntity(options.project || profile.project, profile.token, entityId)
            .then((response) => {
                if (response.success) {
                    let result = response.entity;
                    if (options.query) {
                        result = filterObject(result, options);
                    }
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
        graph.query(options.project || profile.project, profile.token, query)
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
