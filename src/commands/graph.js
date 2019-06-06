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
const debug = require('debug')('cortex:cli');
const split = require('split');
const fs = require('fs');
const Table = require('tty-table');
const ProgressBar = require('progress');
const { loadProfile } = require('../config');
const { Graph } = require('../client/graph');
const { printSuccess, printError, filterObject, printTable } = require('./utils');


function countLinesInFile(file){
    return new Promise((resolve, reject) => {
        let counter = -1;
        fs
            .createReadStream(file)
            .pipe(split())
            .on('data', (doesntMatter) => {
                counter = counter + 1;
            })
            .on('error', (error) => {
                reject(error);
            })
            .on('end', () => {
                resolve(counter);
            });
    });
}

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
            
            // In the case of a stream ... bar is not used ...
            if (!_.isEmpty(bar)){
                bar.tick();
            }
        };

        const processStream = (stream, resolve, reject, bar) => {
            const tasks = [];
            stream.pipe(split((s) => JSON.parse(JSON.stringify(s))))
                .on('data', (event) => tasks.push(publishEvent(event, bar)))
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
                .then((numEvents) => {
                    printSuccess(`Publishing ${numEvents} events from file ${file}`);
                    const bar = new ProgressBar(
                        'publishing [:bar] :current/:total :rate evt/s :elapsed s', 
                        { total: numEvents, width: 65 }
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
