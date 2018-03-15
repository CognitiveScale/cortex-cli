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

module.exports.GetAgentSnapshot = class {

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