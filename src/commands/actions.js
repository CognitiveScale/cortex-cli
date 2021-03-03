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
const _ = require('lodash');
const fs = require('fs');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Actions = require('../client/actions');
const {
 printSuccess, printError, filterObject, parseObject, printTable,
} = require('./utils');

module.exports.ListActionsCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListActions()', profile.name);

        const actions = new Actions(profile.url);
        actions.listActions(options.project || profile.project, profile.token)
            .then((response) => {
                if (response.success) {
                    let result = response.actions;
                    if (options.query) result = filterObject(result, options);

                    if (options.json) {
                        printSuccess(JSON.stringify(result, null, 2), options);
                    } else {
                        const tableSpec = [
                            { column: 'Name', field: 'name', width: 50 },
                            { column: 'Image', field: 'image', width: 50 },
                            { column: 'Created On', field: 'createdAt', width: 26 },
                        ];

                        printTable(tableSpec, result);
                    }
                } else {
                    printError(`Failed to list actions: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list actions: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeActionCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(actionName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeAction(%s)', profile.name, actionName);

        const actions = new Actions(profile.url);
        actions.describeAction(options.project || profile.project, profile.token, actionName)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response.action, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Failed to describe action: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to describe action: ${err.status} ${err.message}`, options);
            });
    }
};

function isNumeric(value) {
    return /^-?\d+$/.test(value);
}

module.exports.DeployActionCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(actionDefinition, command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);

        let actionInst = {};
        if (actionDefinition) {
            try {
                const actionDefStr = fs.readFileSync(actionDefinition);
                actionInst = parseObject(actionDefStr, options);
            } catch (err) {
                printError(`Failed to deploy action: ${err.message}`, options);
            }
        }
        if (options.actionName) {
            actionInst.name = options.actionName;
        }
        if (options.name) {
            actionInst.name = options.name;
        }
        if (options.podspec) {
            const paramsStr = fs.readFileSync(options.podspec);
            actionInst.podSpec = parseObject(paramsStr, options);
        }
        if (options.docker) { actionInst.docker = options.docker; }
        if (options.actionType) { actionInst.actionType = options.actionType; }
        if (options.cmd) { actionInst.command = options.cmd; }
        if (options.port) {
            if (!isNumeric(options.port)) {
                printError('--port must be a number', options);
            }
            actionInst.port = options.port;
        }
        if (options.environmentVariables) { actionInst.environmentVariables = options.environmentVariables; }
        if (options.pushDocker) { actionInst.pushDocker = options.pushDocker; }
        if (options.scaleCount) {
            if (!isNumeric(options.scaleCount)) {
                printError('--scaleCount must be a number', options);
            }
            actionInst.scaleCount = parseInt(options.scaleCount, 10);
        }

        const actions = new Actions(profile.url);
        actions.deployAction(options.project || profile.project, profile.token, actionInst)
            .then((response) => {
                if (response.success) {
                    printSuccess(JSON.stringify(response.message, null, 2), options);
                } else {
                    printError(`Action deployment failed: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to deploy action: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeleteActionCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(actionName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDeleteAction(%s)', profile.name, actionName);
        const { actionType } = options;
        const actions = new Actions(profile.url);
        actions.deleteAction(options.project || profile.project, profile.token, actionName, actionType)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Action deletion failed: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to delete action: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.TaskLogsActionCommand = class {
     constructor(program) {
        this.program = program;
    }

    execute(jobId, taskId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.taskLogsActions (%s, %s)', profile.name, jobId, taskId);
        const actions = new Actions(profile.url);
        actions.taskLogs(options.project || profile.project, profile.token, jobId, taskId)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Action task logs failed: ${response.status} ${response.message}`, options);
                }
        });
    }
};

module.exports.TaskCancelActionCommand = class {
     constructor(program) {
        this.program = program;
    }

    execute(jobId, taskId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.taskCancelActions (%s, %s)', profile.name, jobId, taskId);
        const actions = new Actions(profile.url);
        actions.taskCancel(options.project || profile.project, profile.token, jobId, taskId)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Action cancel task failed: ${response.status} ${response.message}`, options);
                }
        });
    }
};

module.exports.TaskStatusActionCommand = class {
     constructor(program) {
        this.program = program;
    }

    execute(jobId, taskId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.taskStatusActions (%s, %s)', profile.name, jobId, taskId);
        const actions = new Actions(profile.url);
        actions.taskStatus(options.project || profile.project, profile.token, jobId, taskId)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Action task logs failed: ${response.status} ${response.message}`, options);
                }
        });
    }
};

module.exports.JobTaskListActionCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(jobId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.jobTaskListActions (%s, %s)', profile.name, jobId);
        const actions = new Actions(profile.url);
        actions.jobListTasks(options.project || profile.project, profile.token, jobId)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Action list job's tasks failed: ${response.status} ${response.message}`, options);
                }
            });
    }
};


module.exports.TaskStatsActionCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(jobId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.taskStatsActions (%s, %s)', profile.name, jobId);
        const actions = new Actions(profile.url);
        actions.taskStats(options.project || profile.project, profile.token, jobId)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Action get Job tasks stats failed: ${response.status} ${response.message}`, options);
                }
            });
    }
};


module.exports.ListTaskByActivation = class {
    constructor(program) {
        this.program = program;
    }

    execute(activationId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.listTasksByActivation (%s, %s)', profile.name, activationId);
        const actions = new Actions(profile.url);
        actions.listTasksByActivation(options.project || profile.project, profile.token, activationId)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Agent task list by activation failed: ${response.status} ${response.message}`, options);
                }
            });
    }
};

module.exports.GetLogsCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(jobId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.getLogsActions (%s, %s)', profile.name, jobId);
        const actions = new Actions(profile.url);
        actions.getLogsAction(options.project || profile.project, profile.token, jobId)
            .then((response) => {
                if (response.success) {
                    if (options.json) {
                        return printSuccess(JSON.stringify(response, null, 2), options);
                    }
                    const logsStr = _.get(response, 'logs', []).join('/n');
                    return printSuccess(logsStr, options);
                }
                return printError(`Action get logs failed: ${response.status} ${response.message}`, options);
            });
    }
};
