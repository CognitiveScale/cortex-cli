const fs = require('fs');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
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
        const agent = parseObject(agentDefStr);

        catalog.saveAgent(profile.token, agent).then((response) => {
            if (response.success) {
                printSuccess(`Agent saved: ${response.message}`, options);
            }
            else {
                printError(`Failed to save agent: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe agent ${agentName}: ${err.status} ${err.message}`, options);
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