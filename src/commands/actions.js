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
const moment = require('moment');
const { loadProfile } = require('../config');
const Actions = require('../client/actions');

const {
 printSuccess, printError, filterObject, parseObject, printTable, DEPENDENCYTABLEFORMAT, isNumeric,
    validateOptions,
    OPTIONSTABLEFORMAT, handleTable, printExtendedLogs,
} = require('./utils');

module.exports.ListActionsCommand = class {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListActions()', profile.name);

        const actions = new Actions(profile.url);
        const { validOptions, errorDetails } = validateOptions(options, 'ACTION');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Action list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }
        actions.listActions(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort)
            .then((response) => {
                if (response.success) {
                    let result = response.actions;
                    printExtendedLogs('LIMIT', result, options);
                    if (options.json) {
                        if (options.query) result = filterObject(result, options);
                        printSuccess(JSON.stringify(result, null, 2), options);
                    } else {
                        const tableSpec = [
                            { column: 'Name', field: 'name', width: 30 },
                            { column: 'Type', field: 'type', width: 8 },
                            { column: 'Image', field: 'image', width: 50 },
                            { column: 'Modified', field: 'updatedAt', width: 26 },
                            { column: 'Author', field: 'createdBy', width: 26 },
                        ];
                        handleTable(
                            tableSpec,
                            result,
                            (o) => ({ ...o, updatedAt: o.updatedAt ? moment(o.updatedAt).fromNow() : '-' }),
                            'No actions found',
                        );
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

    async execute(actionName, options) {
        const profile = await loadProfile(options.profile);
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

module.exports.DeployActionCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(actionDefinition, options) {
        try {
            const profile = await loadProfile(options.profile);

            let actionInst = {};
            if (actionDefinition) {
                debug('%s.deployActionCommand(%s)', profile.name, actionDefinition);
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
            if (!_.isEmpty(options.k8sResource)) {
                const k8sResources = options.k8sResource.map((f) => parseObject(fs.readFileSync(f), options));
                actionInst.k8sResources = k8sResources;
            }
            if (options.docker) {
                actionInst.image = options.docker;
            }
            if (options.image) {
                actionInst.image = options.image;
            }

            if (options.type) {
                actionInst.type = options.type;
            }
            if (options.actionType) {
                actionInst.type = options.actionType;
            }
            if (options.cmd) {
                actionInst.command = options.cmd;
            }
            if (options.port) {
                if (!isNumeric(options.port)) {
                    printError('--port must be a number', options);
                }
                actionInst.port = options.port;
            }
            if (options.environmentVariables) {
                actionInst.environmentVariables = options.environmentVariables;
            }
            if (options.pushDocker) {
                actionInst.pushDocker = options.pushDocker;
            }
            if (options.scaleCount) {
                if (!isNumeric(options.scaleCount)) {
                    printError('--scaleCount must be a number', options);
                }
                actionInst.scaleCount = parseInt(options.scaleCount, 10);
            }

            if (options.jobTimeout) {
                if (!isNumeric(options.jobTimeout)) {
                    printError('--jobTimeout must be a number', options);
                }
                actionInst.jobTimeout = parseInt(options.jobTimeout, 10);
            }

            // handle mutually exclusive options
            if (actionInst.type === 'job' && _.has(actionInst, 'port')) {
                printError('Option port not valid on job action types');
            }
            if (actionInst.type === 'daemon' && _.has(actionInst, 'jobTimeout')) {
                printError('Option jobTimeout not valid on daemon action types');
            }

            const actions = new Actions(profile.url);
            const response = await actions.deployAction(options.project || profile.project, profile.token, actionInst);
            if (response.success) {
                printSuccess(JSON.stringify(response.message, null, 2), options);
            } else {
                printError(`Action deployment failed: ${response.status} ${response.message}`, options);
            }
        } catch (err) {
                printError(`Failed to deploy action: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.DeleteActionCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(actionName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteAction(%s)', profile.name, actionName);
        const actions = new Actions(profile.url);
        actions.deleteAction(options.project || profile.project, profile.token, actionName)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    return printSuccess(JSON.stringify(result, null, 2), options);
                }
                if (response.status === 403) { // has dependencies
                    const tableFormat = DEPENDENCYTABLEFORMAT;
                    printError(`Action deletion failed: ${response.message}.`, options, false);
                    return printTable(tableFormat, response.details);
                }
                return printError(`Action deletion failed: ${response.status} ${response.message}`, options);
            })
            .catch((err) => {
                printError(`Failed to delete action: ${err.status} ${err.message}`, options);
            });
    }
};
