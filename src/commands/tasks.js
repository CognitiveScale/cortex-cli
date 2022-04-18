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

const debug = require('debug')('cortex:cli');
const _ = require('lodash');
const moment = require('moment');
const { loadProfile } = require('../config');
const Tasks = require('../client/tasks');

const { printSuccess, printError, handleTable } = require('./utils');

module.exports.ListTasksCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        const projectId = options.project || profile.project;
        debug('%s.listTasks(%s)', profile.name);

        const tasks = new Tasks(profile.url);
        const queryParams = {};

        ['activationId', 'skillName', 'actionName', 'sort'].forEach((validParam) => {
               if (options[validParam]) queryParams[validParam] = options[validParam];
            });

        try {
            const response = await tasks.listTasks(projectId, profile.token, queryParams);
            if (response.success) {
                let taskList = _.get(response, 'tasks', []);
                switch (_.lowerCase(options.sort)) {
                    case 'asc':
                        taskList = _.sortBy(tasks, ['startTime']);
                        break;
                    case 'desc':
                        taskList = _.reverse(_.sortBy(tasks, ['startTime']));
                        break;
                    default:
                        // return as-is order
                        break;
                }
                if (options.json) {
                    return printSuccess(JSON.stringify(taskList, null, 2), options);
                }
                const result = _.map(taskList, (t) => ({
                        ...t,
                        start: t.startTime ? moment(t.startTime).fromNow() : '-',
                        took: t.endTime ? moment.duration(t.endTime - t.startTime, 'millis').humanize() : '-',
                    }));
                const tableFormat = [
                    { column: 'Name', field: 'name', width: 40 },
                    { column: 'Activation Id', field: 'activationId', width: 40 },
                    { column: 'Skill Name', field: 'skillName', width: 30 },
                    { column: 'Action Name', field: 'actionName', width: 30 },
                    { column: 'Status', field: 'status', width: 20 },
                    { column: 'Started', field: 'start', width: 25 },
                    { column: 'Took', field: 'took', width: 25 },
                ];
                return handleTable(tableFormat, result);
            }
            return printError(`Failed to list tasks: ${response.message}`, options);
        } catch (err) {
            return printError(`Failed to query tasks: ${err.status} ${err.message} ${JSON.stringify(err)}`, options);
        }
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
        try {
            const response = await tasks.getTask(options.project || profile.project, taskName, profile.token, queryParams);
            if (response.success === false) {
                return printError(`Failed to describe task ${taskName}: ${response.message}`);
            }
            return printSuccess(JSON.stringify(response, null, 2), options);
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
        try {
            const response = await tasks.taskLogs(options.project || profile.project, profile.token, taskName, options.verbose);
            if (response.success) {
                return printSuccess(response.logs, options);
            }
            return printError(`Failed to List Task Logs ${taskName}: ${response.message}`, options);
        } catch (err) {
            return printError(`Failed to query Task Logs ${taskName}: ${err.status} ${err.message}`, options);
        }
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
        try {
            const response = await tasks.deleteTask(options.project || profile.project, profile.token, taskName, options.verbose);
            if (response.success) {
                return printSuccess(JSON.stringify(response), options);
            }
            return printError(`Failed to delete ${taskName}: ${response.message}`, options);
        } catch (err) {
            return printError(`Error deleting ${taskName}: ${err.status} ${err.message}`, options);
        }
    }
};
