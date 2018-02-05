const fs = require('fs');
const uuid = require('uuid');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const Agents = require('../client/agents');
const { printSuccess, printError, filterObject, parseObject } = require('./utils');

module.exports.SaveAgentCommand = class SaveAgentCommand {

    constructor(program) {
        this.program = program;
    }

    execute(agentDefinition, options) {
        debug('%s.executeSaveAgent(%s)', options.profile, agentDefinition);
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);

        const agentDefStr = fs.readFileSync(agentDefinition);
        const agent = parseObject(agentDefStr, options);
        debug('%o', agent);

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
        debug('%s.executeListAgents()', options.profile);
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        
        catalog.listAgents(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.agents, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to list agents: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to list agents ${agentName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeAgentCommand = class DescribeAgentCommand {

    constructor(program) {
        this.program = program;
    }

    execute(agentName, options) {
        debug('%s.executeDescribeAgent(%s)', options.profile, agentName);
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);

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

module.exports.InvokeAgentServiceCommand = class {
    
    constructor(program) {
        this.program = program;
    }

    execute(agentName, serviceName, options) {
        debug('%s.invokeAgentService(%s, %s)', options.profile, agentName, serviceName);
        const profile = loadProfile(options.profile);
        const agents = new Agents(profile.url);

        let params = {};
        if (options.params) {
            params = parseObject(options.params, options);
        }
        else if (options.paramsFile) {
            const paramsStr = fs.readFileSync(options.paramsFile);
            params = parseObject(paramsStr, options);
        }

        debug('params: %o', params);

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
}

module.exports.GetServiceActivationCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(activationId, options) {
        debug('%s.getServiceActivation(%s)', options.profile, activationId);
        const profile = loadProfile(options.profile);
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