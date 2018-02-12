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

const chalk = require('chalk');
const jmsepath = require('jmespath');
const yaml = require('js-yaml');
const debug = require('debug')('cortex:cli');
const Table = require('cli-table');

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
};

function _extractValues(fields, obj) {
    const rv = [];
    fields.forEach((f) => rv.push(obj[f] || '-'));
    return rv;
}

module.exports.printTable = function(spec, objects, transform) {
    transform = transform || function (obj) { return obj; };

    const head = spec.map((s) => s.column);
    const colWidths = spec.map((s) => s.width);
    const fields = spec.map((s) => s.field);
    const values = objects.map((obj) => _extractValues(fields, transform(obj)));

    debug('printing fields: %o', fields);

    const table = new Table({head, colWidths, style: {head: ['cyan']}});
    values.forEach((v) => table.push(v));

    console.log(table.toString());
};
