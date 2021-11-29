/*
 * Copyright 2020 Cognitive Scale, Inc. All Rights Reserved.
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
const _ = require('lodash');
const moment = require('moment');
const { loadProfile } = require('../config');
// const Catalog = require('../client/catalog');
const Tasks = require('../client/tasks');
const { LISTTABLEFORMAT, DEPENDENCYTABLEFORMAT } = require('./utils');

const {
 printSuccess, printError, filterObject, parseObject, printTable, formatValidationPath,
} = require('./utils');
const Catalog = require("../client/catalog");

module.exports.ListTasksCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        // if (_.isEmpty(options.agentName)
        //     && _.isEmpty(options.skillName)
        //     && _.isEmpty(options.correlationId)
        //     && _.isEmpty(options.status)) {
        //     printError('Either --agentName, --skillName, --correlationId, or --status must be provided', options);
        // }
        const profile = await loadProfile(options.profile);
        debug('%s.listTasks(%s)', profile.name);

        const tasks = new Tasks(profile.url);
        // TODO validate param types?
        const queryParams = { ...options };

        tasks.listTasks(options.project || profile.project, profile.token, queryParams).then((response) => {
            if (response.success) {
                printSuccess(JSON.stringify(response, null, 2), options);
            } else {
                printError(`Failed to list tasks: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to query tasks: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeTaskCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(taskName, options) {
        const profile = await loadProfile(options.profile);
        const queryParams = {};
        debug('%s.describeTask(%s)', profile.name, taskName);

        if (options.k8s) queryParams.k8s = true;
        const tasks = new Tasks(profile.url);
        const output = _.get(options, 'output', 'json');
        try {
            const response = await tasks.getTask(options.project || profile.project, taskName, profile.token, queryParams);
            if (response.success === false) {
                return printError(`Failed to describe task ${taskName}: ${response.message}`);
            }
            if (output.toLowerCase() === 'json') {
                // const result = filterObject(JSON.parse(response), options);
                return printSuccess(JSON.stringify(response, null, 2), options);
            }
            return printSuccess(response);
        } catch (err) {
            return printError(`Failed to fetch task ${taskName}: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.TaskLogsCommand = class TaskLogsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(taskName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeTaskLogs(%s)', profile.name, taskName);
        const tasks = new Tasks(profile.url);
        tasks.taskLogs(options.project || profile.project, profile.token, taskName, options.verbose).then((response) => {
            if (response.success) {
                printSuccess(JSON.stringify(response.logs), options);
            } else {
                printError(`Failed to List Task Logs ${taskName}: ${response.message}`, options);
            }
        }).catch((err) => {
                printError(`Failed to query Task Logs ${taskName}: ${err.status} ${err.message}`, options);
            }
        );
    }
};

module.exports.TaskDeleteCommand = class TaskDeleteCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(taskName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteTask(%s)', profile.name, taskName);
        const tasks = new Tasks(profile.url);
        tasks.deleteTask(options.project || profile.project, profile.token, taskName, options.verbose).then((response) => {
            if (response.success) {
                printSuccess(JSON.stringify(response), options);
            } else {
                printError(`Failed to delete ${taskName}: ${response.message}`, options);
            }
        }).catch((err) => {
                printError(`Error deleting ${taskName}: ${err.status} ${err.message}`, options);
            }
        );
    }
};
