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
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const Agents = require('../client/agents');
const {
 printSuccess, printError, filterObject, parseObject, printTable, formatValidationPath
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
        }})
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
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Title', field: 'title', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                        { column: 'Created On', field: 'createdAt', width: 26 },
                    ];
                    printTable(tableSpec, result);
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
            catalog.describeAgent(options.project || profile.project, profile.token, agentName).then((response) => {
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
            params = parseObject(options.params, options);
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

        const agents = new Agents(profile.url);
        agents.getActivation(options.project || profile.project, profile.token, activationId).then((response) => {
            if (response.success) {
                const result = filterObject(response.result.activation, options);
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

    execute(instanceId, options) {
        const profile = loadProfile(options.profile);
        const envName = options.environmentName;
        debug('%s.listActivations(%s)', profile.name, instanceId);

        const agents = new Agents(profile.url);
        agents.listActivations(options.project || profile.project, profile.token, instanceId, envName).then((response) => {
            if (response.success) {
                let result = response.result.activations;
                if (options.query) result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Activation Id', field: 'activationId', width: 38 },
                        { column: 'Type', field: 'type', width: 20 },
                        { column: 'Status', field: 'status', width: 15 },
                        { column: 'Start', field: 'start', width: 15 },
                        { column: 'End', field: 'end', width: 15 },
                        { column: 'Session Id', field: 'sessionId', width: 38 },
                    ];

                    printTable(tableSpec, result);
                }
            } else {
                printError(`Failed to list activations for instance ${instanceId}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list activations for instance ${instanceId}: ${err.status} ${err.message}`, options);
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
        const envName = options.environmentName;
        debug('%s.listAgentSnapshots(%s)', profile.name, agentName);

        const agents = new Agents(profile.url);
        agents.listAgentSnapshots(options.project || profile.project, profile.token, agentName, envName)
            .then((response) => {
            if (response.success) {
                const result = filterObject(response.result.snapshots, options);
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Snapshot ID', field: 'id', width: 40 },
                        { column: 'Title', field: 'title', width: 30 },
                        { column: 'Agent Version', field: 'agentVersion', width: 15 },
                        { column: 'Environment', field: 'environmentName', width: 30 },
                        { column: 'Created On', field: 'createdAt', width: 26 },
                    ];
                    printTable(tableSpec, result);
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

// module.exports.ListTriggersCommand = class {
//     constructor(program) {
//         this.program = program;
//     }
//
//     execute(options) {
//         const profile = loadProfile(options.profile);
//         debug('%s.listTriggers', profile.name);
//
//         const agents = new Agents(profile.url);
//         agents.listTriggers(profile.token).then((response) => {
//             if (response.success) {
//                 const result = filterObject(response.result, options);
//                 printSuccess(JSON.stringify(result, null, 2), options);
//             } else {
//                 printError(`Failed to list triggers ${instanceId}: ${response.message}`, options);
//             }
//         })
//             .catch((err) => {
//                 printError(`Failed to list triggers ${instanceId} : ${err.status} ${err.message}`, options);
//             });
//     }
// };
