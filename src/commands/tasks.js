/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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

const fs = require('fs');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Tasks = require('../client/tasks');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

module.exports.ListTasks = class ListTasks {

    constructor(program) {
        this.program = program;
    }

    execute(jobDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.listTasks()', profile.name);

        const tasks = new Tasks(profile.url, jobDefinition);
        tasks.listTasks(profile.token).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    let result = filterObject(response.result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Tasks', field: 'name', width: 40 }
                    ];
                    printTable(tableSpec, response.result.tasks.map(ea => ({"name": ea})));
                }
            }
            else {
                printError(`Failed to list tasks: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list tasks: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.TaskLogs = class TaskLogs {

    constructor(program) {
        this.program = program;
    }

    execute(jobDefinition, taskDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.taskLogs()', profile.name);

        const tasks = new Tasks(profile.url, jobDefinition);
        tasks.taskLogs(profile.token, taskDefinition).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    let result = filterObject(response.result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Status', field: 'status', width: 40 },
                        { column: 'Message', field: 'message', width: 40 }
                    ];
                    printTable(tableSpec, [response.result]);
                }
            }
            else {
                printError(`Failed to fetch logs: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to fetch logs: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.CancelTask = class CancelTask {

    constructor(program) {
        this.program = program;
    }

    execute(jobDefinition, taskDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.cancelTask()', profile.name);

        const message = options.message;
        const tasks = new Tasks(profile.url, jobDefinition);
        tasks.cancelTask(profile.token, taskDefinition, message).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    let result = filterObject(response.result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Status', field: 'status', width: 20 }
                    ];
                    printTable(tableSpec, [response.result]);
                }
            }
            else {
                printError(`Failed to cancel task: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to cancel task: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeTask = class DescribeTask {

    constructor(program) {
        this.program = program;
    }

    execute(jobDefinition, taskDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.describeTask()', profile.name);

        const tasks = new Tasks(profile.url, jobDefinition);
        tasks.describeTask(profile.token, taskDefinition).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    let result = filterObject(response.result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Id', field: 'id', width: 40 },
                        { column: 'Status', field: 'status', width: 15 },
                        { column: 'Created At', field: 'createdAt', width: 15 },
                        { column: 'Started At', field: 'startedAt', width: 15 },
                        { column: 'Stopped At', field: 'stoppedAt', width: 15 }
                    ];
                    printTable(tableSpec, [response.result]);
                }
            }
            else {
                printError(`Failed to describe task: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to describe task: ${err.status} ${err.message}`, options);
        });
    }
};