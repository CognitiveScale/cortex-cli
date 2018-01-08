const debug = require('debug')('cortex:cli');
const Catalog = require('../client/catalog');

module.exports.SaveAgentCommand = class SaveAgentCommand {

    constructor(program) {
        this.program = program;
    }

    execute(agentDefinition, options) {
        debug('executeSaveAgent(%s)', agentDefinition);
    }
};