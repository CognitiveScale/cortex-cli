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
const { loadProfile } = require('../config');
const { Graph } = require('../client/graph');
const { printSuccess, printError, filterObject, formatValidationPath, printTable } = require('./utils');

class FindEntitiesCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeFindEntities()', profile.name);

        const graph = new Graph(profile.url);
        graph.findEntities(profile.token, options.filter, options.sort, options.limit, options.skip)
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

        const publishEvent = async (event) => {
            if (!event) return;

            debug('publishing event: ', event);
            ++eventCount;

            let rs;
            if (options.tracking) {
                rs = await graph.track(profile.token, event);
            }
            else {
                rs = await graph.publishEntities(profile.token, event);
            }

            if (!rs.success) errors.push(rs.message);
        };

        const processStream = (stream, resolve, reject) => {
            const tasks = [];
            stream.pipe(split((s) => JSON.parse(JSON.stringify(s))))
                .on('data', (event) => tasks.push(publishEvent(event)))
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
            return new Promise((resolve, reject) => {
                const stream = fs.createReadStream(file).pipe(split((s) => JSON.parse(JSON.stringify(s))));
                processStream(stream, resolve, reject);
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

module.exports = {
    FindEntitiesCommand,
    PublishEventsCommand,
};
