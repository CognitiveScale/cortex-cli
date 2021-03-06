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
const Catalog = require('../client/catalog');
const Agents = require('../client/agents');
const { LISTTABLEFORMAT } = require('./utils');

const {
 printSuccess, printError, filterObject, parseObject, printTable, formatValidationPath,
} = require('./utils');

module.exports.SaveAgentCommand = class SaveAgentCommand {
    constructor(program) {
        this.program = program;
    }

    execute(agentDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeSaveAgent(%s)', profile.name, agentDefinition);

        const agentDefStr = fs.readFileSync(agentDefinition);
        const agent = parseObject(agentDefStr, options);
        debug('%o', agent);

        const catalog = new Catalog(profile.url);
        catalog.saveAgent(options.project || profile.project, profile.token, agent).then((response) => {
            if (response.success) {
                printSuccess('Agent saved', options);
            } else if (response.details) {
            console.log(`Failed to save agent: ${response.status} ${response.message}`);
            console.log('The following issues were found:');
            const tableSpec = [
                { column: 'Path', field: 'path', width: 50 },
                { column: 'Message', field: 'message', width: 100 },
            ];
            response.details.map(d => d.path = formatValidationPath(d.path));
            printTable(tableSpec, response.details);
            printError(''); // Just exit
        } else {
            printError(JSON.stringify(response));
        }
        })
        .catch((err) => {
            printError(`Failed to save agent: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListAgentsCommand = class ListAgentsCommand {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListAgents()', profile.name);

        const catalog = new Catalog(profile.url);
        catalog.listAgents(options.project || profile.project, profile.token).then((response) => {
            if (response.success) {
                let result = response.agents;
                if (options.query) result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printTable(LISTTABLEFORMAT, result, o => ({ ...o, updatedAt: o.updatedAt ? moment(o.updatedAt).fromNow() : '-' }));
                }
            } else {
                printError(`Failed to list agents: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list agents: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeAgentCommand = class DescribeAgentCommand {
    constructor(program) {
        this.program = program;
    }

    execute(agentName, options) {
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        if (options.versions) {
            debug('%s.executeDescribeAgentVersions(%s)', profile.name, agentName);
            catalog.describeAgentVersions(options.project || profile.project, profile.token, agentName).then((response) => {
                if (response.success) {
                    const result = filterObject(response.agent, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Failed to describe agent versions ${agentName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to describe agent versions ${agentName}: ${err.status} ${err.message}`, options);
            });
        } else {
            debug('%s.executeDescribeAgent(%s)', profile.name, agentName);
            catalog.describeAgent(options.project || profile.project, profile.token, agentName, options.verbose).then((response) => {
                if (response.success) {
                    const result = filterObject(response.agent, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Failed to describe agent ${agentName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to describe agent ${agentName}: ${err.status} ${err.message}`, options);
            });
        }
    }
};

module.exports.InvokeAgentServiceCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(agentName, serviceName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.invokeAgentService(%s, %s)', profile.name, agentName, serviceName);

        let params = {};
        if (options.params) {
            try {
                params = parseObject(options.params, options);
            } catch (e) {
                printError(`Failed to parse params: ${options.params} Error: ${e}`, options);
            }
        } else if (options.paramsFile) {
            const paramsStr = fs.readFileSync(options.paramsFile);
            params = parseObject(paramsStr, options);
        }

        debug('params: %o', params);

        const agents = new Agents(profile.url);
        agents.invokeAgentService(options.project || profile.project, profile.token, agentName, serviceName, params).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Invocation failed: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            if (err.response && err.response.body) {
                debug('Raw error response: %o', err.response.body);
                printError(`Failed to invoke agent service (${err.status} ${err.message}): ${err.response.body.error}`, options);
            } else {
                printError(`Failed to invoke agent service: ${err.status} ${err.message}`, options);
            }
        });
    }
};

module.exports.GetActivationCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(activationId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.getActivation(%s)', profile.name, activationId);
        const { verbose, project } = options;
        const agents = new Agents(profile.url);
        agents.getActivation(project || profile.project, profile.token, activationId, verbose).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to get activation ${activationId}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to get activation ${activationId}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListActivationsCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        if (_.isEmpty(options.agentName) && _.isEmpty(options.correlationId) && _.isEmpty(options.status)) {
            printError('Either --agentName, --correlationId, or --status must be provided', options);
        }
        const profile = loadProfile(options.profile);
        debug('%s.listActivations(%s)', profile.name);

        const agents = new Agents(profile.url);
        // TODO validate param types?
        const queryParams = {};
        if (options.startBefore) queryParams.startBefore = options.startBefore;
        if (options.startAfter) queryParams.startAfter = options.startAfter;
        if (options.endBefore) queryParams.endBefore = options.endBefore;
        if (options.endAfter) queryParams.endAfter = options.endAfter;
        if (options.status) queryParams.status = _.toUpper(options.status);
        if (options.correlationId) queryParams.correlationId = options.correlationId;
        if (options.agentName) queryParams.agentName = options.agentName;
        if (options.limit) queryParams.limit = options.limit;
        if (options.offset) queryParams.offset = options.offset;
        if (options.sort) queryParams.sort = _.toLower(options.sort);

        agents.listActivations(options.project || profile.project, profile.token, queryParams).then((response) => {
            if (response.success) {
                let result = response.result.activations;
                if (options.query) result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Activation Id', field: 'activationId', width: 40 },
                        { column: 'Status', field: 'status', width: 20 },
                        { column: 'Started', field: 'start', width: 65 },
                    ];
                    printTable(tableSpec, _.map(result, o => ({ ...o, start: o.start ? moment(o.start).fromNow() : '-' })));
                }
            } else {
                printError(`Failed to list activations: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list activations: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ListServicesCommand = class ListServicesCommand {
    constructor(program) {
        this.program = program;
    }

    execute(agentName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.listServices(%s)', profile.name, agentName);

        const catalog = new Catalog(profile.url);
        catalog.listServices(options.project || profile.project, profile.token, agentName, profile).then((response) => {
            if (response.success) {
                const result = filterObject(response.services, options);
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Service Name', field: 'name', width: 25 },
                        { column: 'Service Endpoint URL', field: 'url', width: 115 },
                        { column: 'Parameters', field: 'formatted_types', width: 65 },
                    ];
                    printTable(tableSpec, result);
                }
            } else {
                printError(`Failed to return agent service information: ${agentName}: ${response.message}`, options);
            }
        }).catch((err) => {
            printError(`Failed to return agent service information: ${agentName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListAgentSnapshotsCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(agentName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.listAgentSnapshots(%s)', profile.name, agentName);

        const agents = new Agents(profile.url);
        agents.listAgentSnapshots(options.project || profile.project, profile.token, agentName)
            .then((response) => {
            if (response.success) {
                const result = filterObject(response.result.snapshots, options);
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Snapshot ID', field: 'snapshotId', width: 40 },
                        { column: 'Title', field: 'title', width: 40 },
// Removed as this is confusing for end users, agent version may not change
//                        { column: 'Agent Version', field: 'agentVersion', width: 15 },
                        { column: 'Created', field: 'createdAt', width: 26 },
                        { column: 'Author', field: 'createdBy', width: 26 },
                    ];
                    printTable(tableSpec, result, o => ({ ...o, createdAt: o.createdAt ? moment(o.createdAt).fromNow() : '-' }));
                }
            } else {
                printError(`Failed to list agent snapshots ${agentName}: ${response.message}`, options);
            }
        })

            .catch((err) => {
                printError(`Failed to list agent snapshots ${agentName}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeAgentSnapshotCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(snapshotId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.describeAgentSnapshot(%s)', profile.name, snapshotId);

        const agents = new Agents(profile.url);
        const output = _.get(options, 'output', 'json');
        try {
            const response = await agents.describeAgentSnapshot(options.project || profile.project, profile.token, snapshotId, output);
            if (response.success === false) {
                return printError(`Failed to describe agent snapshot ${snapshotId}: ${response.message}`);
            }
            if (output.toLowerCase() === 'json') {
                const result = filterObject(JSON.parse(response), options);
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            return printSuccess(response);
        } catch (err) {
            return printError(`Failed to describe agent snapshot ${snapshotId}: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.CreateAgentSnapshotCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(snapshotDefinition, options) {
        const profile = loadProfile(options.profile);
        let snapshot;
        if (snapshotDefinition) {
            debug('%s.createAgentSnapshot(%s)', profile.name, snapshotDefinition);
            const snapshotDefStr = fs.readFileSync(snapshotDefinition);
            snapshot = parseObject(snapshotDefStr, options);
        } else if (_.get(options, 'title', '').length > 0 && _.get(options, 'agentName', '').length > 0) {
            snapshot = { agentName: options.agentName, title: options.title };
        } else {
            printError('Either --title <..> and --agentName <..> or a snapshot definition file must be provided', options);
            return;
        }
        const { agentName } = snapshot;
        const agents = new Agents(profile.url);
        agents.createAgentSnapshot(options.project || profile.project, profile.token, snapshot).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to create agent snapshot ${agentName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to create agent snapshot ${agentName}: ${err.status} ${err.message}`, options);
            });
    }
};
