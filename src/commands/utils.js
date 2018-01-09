const chalk = require('chalk');
const jmsepath = require('jmespath');
const yaml = require('js-yaml');
const debug = require('debug')('cortex:cli');

module.exports.printSuccess = function(message, options) {
    if (options.color === 'on') {
        console.log(chalk.green(message));
    }
    else {
        console.log(message);
    }
};

module.exports.printError = function(message, options) {
    if (options.color === 'on') {
        console.error(chalk.red(message));
    }
    else {
        console.error(message);
    }
};

module.exports.filterObject = function(obj, options) {
    if (options.query) {
        debug('filtering results with query: ' + options.query);
        return jmsepath.search(obj, options.query);
    }
    return obj;
};

module.exports.parseObject = function(str, options) {
    if (options.yaml) {
        return yaml.safeLoad(str);
    }
    
    return JSON.parse(str);
}