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
const Catalog = require('../client/catalog');
const Agents = require('../client/agents');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

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
        catalog.saveAgent(profile.token, agent).then((response) => {
            if (response.success) {
                printSuccess(`Agent saved`, options);
            }
            else {
                printError(`Failed to save agent: ${response.status} ${response.message}`, options);
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
        catalog.listAgents(profile.token).then((response) => {
            if (response.success) {
                let result = response.agents;
                if (options.query)
                    result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Title', field: 'title', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                        { column: 'Created On', field: 'createdAt', width: 26 }
                    ];

                    printTable(tableSpec, result);
                }
            }
            else {
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
            catalog.describeAgentVersions(profile.token, agentName).then((response) => {
                if (response.success) {
                    let result = filterObject(response.agent, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    printError(`Failed to describe agent versions ${agentName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to describe agent versions ${agentName}: ${err.status} ${err.message}`, options);
            });
        }

        else {
            debug('%s.executeDescribeAgent(%s)', profile.name, agentName);
            catalog.describeAgent(profile.token, agentName).then((response) => {
                if (response.success) {
                    let result = filterObject(response.agent, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
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
        }
        else if (options.paramsFile) {
            const paramsStr = fs.readFileSync(options.paramsFile);
            params = parseObject(paramsStr, options);
        }

        debug('params: %o', params);

        const agents = new Agents(profile.url);
        agents.invokeAgentService(profile.token, agentName, serviceName, params).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Invocation failed: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            if (err.response && err.response.body) {
                debug('Raw error response: %o', err.response.body);
                printError(`Failed to invoke agent service (${err.status} ${err.message}): ${err.response.body.error}`, options);
            }
            else {
                printError(`Failed to invoke agent service: ${err.status} ${err.message}`, options);
            }
        });
    }
};

module.exports.GetServiceActivationCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(activationId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.getServiceActivation(%s)', profile.name, activationId);

        const agents = new Agents(profile.url);
        agents.getServiceActivation(profile.token, activationId).then((response) => {
            if (response.success) {
                let result = filterObject(response.result.activation, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to get service activation ${activationId}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to get service activation ${activationId}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListAgentInstancesCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(agentName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.listAgentInstances(%s)', profile.name, agentName);

        const agents = new Agents(profile.url);
        agents.listAgentInstances(profile.token, agentName).then((response) => {
            if (response.success) {
                let result = filterObject(response.result.instances, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to list agent instances ${agentName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list agent instances ${agentName}: ${err.status} ${err.message}`, options);
            });
    }
};


module.exports.GetAgentSnapshotCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(agentName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.getAgentSnapshot(%s)', profile.name, agentName);

        const agents = new Agents(profile.url);
        agents.getAgentSnapshot(profile.token, agentName).then((response) => {
            if (response.success) {
                let result = filterObject(response.result.snapshots, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to get agent snapshot ${agentName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to get agent snapshot ${agentName}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.CreateAgentSnapshotCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(snapshotDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.createAgentSnapshot(%s)', profile.name, snapshotDefinition);

        const snapshotDefStr = fs.readFileSync(snapshotDefinition);
        const snapshot = parseObject(snapshotDefStr, options);
        const agentName = snapshot.agentName;

        const agents = new Agents(profile.url);
        agents.createAgentSnapshot(profile.token, snapshot).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to create agent snapshot ${agentName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to create agent snapshot ${agentName}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.CreateAgentInstanceCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(instanceDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.createAgentInstance', profile.name);

        const agents = new Agents(profile.url);
        const instanceDefStr = fs.readFileSync(instanceDefinition);
        const instance = parseObject(instanceDefStr, options);
        agents.createAgentInstance(profile.token, instance).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to create agent instance : ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to create agent instance : ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.GetAgentInstanceCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(instanceId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.getAgentInstance(%s)', profile.name, instanceId);

        const agents = new Agents(profile.url);
        agents.getAgentInstance(profile.token, instanceId).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    const tableSpec = [
                        { column: 'Instance Id', field: '_id', width: 26 },
                        { column: 'Status', field: 'status', width: 15 },
                        { column: 'Tenant Id', field: 'tenantId', width: 20 },
                        { column: 'Snapshot Id', field: 'snapshotId', width: 26 },
                        { column: 'Environment Id', field: 'environmentId', width: 26 },
                        { column: 'Created At', field: 'createdAt', width: 26 },
                        { column: 'Updated At', field: 'updatedAt', width: 26 }
                    ];
                    printTable(tableSpec, [result.instance]);
                }

            }
            else {
                printError(`Failed to get agent instance ${instanceId}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to get agent instance ${instanceId}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeleteAgentInstanceCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(instanceId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.deleteAgentInstance(%s)', profile.name, instanceId);

        const agents = new Agents(profile.url);
        agents.deleteAgentInstance(profile.token, instanceId).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to delete agent instance ${instanceId}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to delete agent instance ${instanceId} : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.StopAgentInstanceCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(instanceId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.stopAgentInstance(%s)', profile.name, instanceId);

        const agents = new Agents(profile.url);
        agents.stopAgentInstance(profile.token, instanceId).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to stop agent instance ${instanceId}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to stop agent instance ${instanceId} : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ListTriggersCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listTriggers', profile.name);

        const agents = new Agents(profile.url);
        agents.listTriggers(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to list triggers ${instanceId}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list triggers ${instanceId} : ${err.status} ${err.message}`, options);
            });
    }
};