import _ from 'lodash';
import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Actions from '../client/actions.js';
import {
 printSuccess, printError, filterObject, parseObject, isNumeric, handleTable, printExtendedLogs, handleListFailure, handleDeleteFailure, getFilteredOutput, 
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export const ListActionsCommand = class {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListActions()', profile.name);
        const actions = new Actions(profile.url);
        actions.listActions(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort)
            // eslint-disable-next-line consistent-return
            .then((response) => {
            if (response.success) {
                const result = response.actions;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    printExtendedLogs(result, options);
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 30 },
                        { column: 'Type', field: 'type', width: 8 },
                        { column: 'Image', field: 'image', width: 50 },
                        { column: 'Modified', field: 'updatedAt', width: 26 },
                        { column: 'Author', field: 'createdBy', width: 26 },
                    ];
                    handleTable(tableSpec, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No actions found');
                }
            } else {
                return handleListFailure(response, options, 'Actions');
            }
        })
            .catch((err) => {
            printError(`Failed to list actions: ${err.status} ${err.message}`, options);
        });
    }
};
export const DescribeActionCommand = class {
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
                getFilteredOutput(response.action, options);
            } else {
                printError(`Failed to describe action: ${response.status} ${response.message}`, options);
            }
        })
            .catch((err) => {
            printError(`Failed to describe action: ${err.status} ${err.message}`, options);
        });
    }
};
export const DeployActionCommand = class {
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
export const DeleteActionCommand = class {
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
            return handleDeleteFailure(response, options, 'Action');
        })
            .catch((err) => {
            printError(`Failed to delete action: ${err.status} ${err.message}`, options);
        });
    }
};
