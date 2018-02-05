const debug = require('debug')('cortex:cli');
const yeoman = require('yeoman-environment');
const { printSuccess, printError, filterObject, parseObject } = require('./utils');

module.exports.GenerateProjectCommand = class GenerateProjectCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.generateProject()', options.profile);
        const yenv = yeoman.createEnv();
        yenv.register(require.resolve('generator-cortex'), 'cortex:app');
        // TODO: figure out which parameters to bubble up to the CLI,
        // and plumb the values through to the yeoman generator.
        yenv.run('cortex:app', { });
    }
};
