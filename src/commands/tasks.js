import debugSetup from 'debug';
import _ from 'lodash';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Tasks from '../client/tasks.js';
import {
 printSuccess, printError, handleTable, printExtendedLogs, getFilteredOutput, 
} from './utils.js';
/*
 * Copyright 2023 Cognitive Scale, Inc. All Rights Reserved.
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
const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
const TASK_LIST_TABLE = [
    { column: 'Name', field: 'name', width: 60 },
    { column: 'Activation Id', field: 'activationId', width: 40 },
    { column: 'Skill Name', field: 'skillName', width: 40 },
    { column: 'Status', field: 'state', width: 20 },
    { column: 'Started', field: 'start', width: 25 },
    { column: 'Took', field: 'took', width: 25 },
];
const SCHED_LIST_TABLE = [
    { column: 'Name', field: 'name', width: 60 },
    { column: 'Skill Name', field: 'skillName', width: 40 },
    { column: 'Status', field: 'state', width: 20 },
    { column: 'Started', field: 'start', width: 25 },
    { column: 'Schedule', field: 'schedule', width: 12 },
];
export const ListTasksCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        const projectId = options.project || profile.project;
        debug('%s.listTasks(%s)', profile.name);
        const tasks = new Tasks(profile.url);
        if (options.limit) {
            const num = _.toNumber(options.limit);
            if (Number.isNaN(num) || num < 0) {
                printError('--limit <limit> must be a positive integer value');
            }
        }
        try {
            const response = await tasks.listTasks(projectId, profile.token, options);
            let format = 'k8sFormat'; // Assume old format
            if (response.success) {
                let taskList = _.get(response, 'tasks', []);
                if (_.isEmpty(taskList)) {
                    return printSuccess('No tasks found');
                }
                // Old response format ["taskName", "taskName",...]
                if (_.isString(taskList[0])) {
                    taskList = _.map(taskList, (t) => ({ name: t }));
                } else {
                    if (!_.has(taskList[0], 'status')) { // previous k8s format has [{ status},{},{}]
                        format = 'dbFormat';
                    }
                    taskList = _.map(taskList, (t) => ({
                        ...t,
                        state: t.status || t.state,
                        start: t.startTime ? dayjs(t.startTime).fromNow() : '-',
                        took: t.endTime ? dayjs(t.endTime).from(dayjs(t.startTime), true) : '-',
                    }));
                }
                if (format === 'k8sFormat') {
                    switch (_.lowerCase(options.sort)) {
                        case 'asc':
                            taskList = _.sortBy(taskList, ['startTime']);
                            break;
                        case 'desc':
                            taskList = _.reverse(_.sortBy(taskList, ['startTime']));
                            break;
                        default:
                            // return as-is order
                            break;
                    }
                }
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    return getFilteredOutput(taskList, options);
                }
                printExtendedLogs(taskList, options);
                const tableCols = options.scheduled ? SCHED_LIST_TABLE : TASK_LIST_TABLE;
                return handleTable(tableCols, taskList);
            }
            return printError(`Failed to list tasks: ${response.message}`, options);
        } catch (err) {
            return printError(`Failed to query tasks: ${err.status} ${err.message} ${JSON.stringify(err)}`, options);
        }
    }
};
export const DescribeTaskCommand = class {
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
export class TaskLogsCommand {
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
            return printError(`Failed to List Task Logs "${taskName}": ${response.message}`, options);
        } catch (err) {
            return printError(`Failed to query Task Logs "${taskName}": ${err.status} ${err.message}`, options);
        }
    }
}
export class TaskDeleteCommand {
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
}
export class TaskPauseCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(taskNames, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executePauseTask(%s)', profile.name, taskNames.join(','));
        const tasks = new Tasks(profile.url);
        try {
            return Promise.all(taskNames.map(async (taskName) => {
                const response = await tasks.pauseTask(options.project || profile.project, profile.token, taskName, options.verbose);
                if (response.success) {
                    return printSuccess(JSON.stringify(response), options);
                }
                return printError(`Failed to pause "${taskName}": ${response.message}`, options);
            }));
        } catch (err) {
            return printError(`Error pausing "${taskNames.join(',')}": ${err.status} ${err.message}`, options);
        }
    }
}
export class TaskResumeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(taskNames, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeResumeTask(%s)', profile.name, taskNames.join(','));
        const tasks = new Tasks(profile.url);
        try {
            return Promise.all(taskNames.map(async (taskName) => {
                const response = await tasks.resumeTask(options.project || profile.project, profile.token, taskName, options.verbose);
                if (response.success) {
                    return printSuccess(JSON.stringify(response), options);
                }
                return printError(`Failed to resume task "${taskName}": ${response.message}`, options);
            }));
        } catch (err) {
            return printError(`Error resume tasks "${taskNames.join(',')}": ${err.status} ${err.message}`, options);
        }
    }
}
