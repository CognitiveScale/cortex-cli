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

const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const jmsepath = require('jmespath');
const glob = require('glob');
const yaml = require('js-yaml');
const debug = require('debug')('cortex:cli');
const Table = require('cli-table');
const { exec } = require('child_process');

module.exports.constructError = function(error) {
    // fallback to text in message or standard error message
    let errResp = error.response;
    let errorText = _.get(errResp, 'body', error.message);
    let details;

    // if JSON was returned, look for either a message or error in it
    try {
        const resp = errResp ? JSON.parse(errResp.text) : {};
        if (resp.message || resp.error) errorText = resp.message || resp.error;
        details = resp.details;
    } catch(e) {
        // Guess it wasn't JSON!
    }
    return {success: false, message: errorText, details, status: error.status || ''};
};

module.exports.printSuccess = function(message, options) {
    if (!options || options.color === 'on') {
        console.log(chalk.green(message));
    }
    else {
        console.log(message);
    }
};

module.exports.printWarning = function(message, options) {
    if (!options || options.color === 'on') {
        console.log(chalk.yellow(message));
    }
    else {
        console.log(message);
    }
};

module.exports.printError = function(message, options, exit = true) {
    if (!options ||  options.color === 'on') {
        console.error(chalk.red(message));
    }
    else {
        console.error(message);
    }
    if (exit) {
        process.exit(1)
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
    fields.forEach((f) => rv.push((obj !== undefined && obj !== null && obj[f] !== undefined && obj[f] !== null)? obj[f].toString() : '-'));
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

module.exports.exportDoc = function(program){
    console.log(JSON.stringify(program.commands.map((c)=>({
        name: c._name,
        description: c._description,
        usage:  c.usage(),
        options: c.options.map((o)=>({
            flags: o.flags,
            defaultValue: o.defaultValue,
            description: o.description
        }))
    }))));
    process.exit(0);
};

/**
 * Execute a sub command, return stdout on success, return stderr on failure
 * @param commandStr
 * @returns {Promise<*>}
 */
async function callMe(commandStr) {
    return new Promise((resolve, reject) => {
        const proc = exec(commandStr,(err, stdout) => {
            if (err) {
                reject(err.message + stdout);
            } else {
                resolve(stdout);
            }
        });
        // Pipe stdout to stderr in real time:
        proc.stdout.pipe(process.stderr);

    });
}

module.exports.callMe = callMe;

module.exports.getSourceFiles = function(source, cb) {
    const options = {silent:true};
    const normalizedSource = (source.endsWith('/')) ? source : `${source}/`;
    const normalizedPath = path.join(normalizedSource, '**', '*');
    glob(normalizedPath, options, function (err, files) {
        // files is an array of filenames.
        if (err) {
            cb(err, null);
        } else {
            const results = files.filter(path => fs.lstatSync(path).isFile()).map((path) => {
                return {
                    canonical: path,
                    relative: path.slice(normalizedSource.length),
                    size: fs.lstatSync(path).size,
                };
            });
            cb(null, results);
        }
    });
};

function round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.floor(value * multiplier) / multiplier;
}

module.exports.humanReadableFileSize = function(sizeInBytes) {
    const ranges = {
        'K': Math.pow(10, 3),
        'M': Math.pow(10, 6),
        'G': Math.pow(10, 9),
        'T': Math.pow(10, 12),
    };
    if (sizeInBytes < ranges['K']) {
        return `${sizeInBytes}B`
    } else if (sizeInBytes < ranges['M']) {
        return `${round(sizeInBytes/ranges['K'], 1)}K`
    } else if (sizeInBytes < ranges['G']) {
        return `${round(sizeInBytes/ranges['M'], 1)}M`
    } else if (sizeInBytes < ranges['T']) {
        return `${round(sizeInBytes/ranges['G'], 1)}G`
    }

};

module.exports.formatAllServiceInputParameters = function(allParameters){
     if(allParameters.$ref != null){
         return `$ref:${allParameters.$ref}`;
     }
     else{
         return allParameters.map(inputParameters => formatServiceInputParameter(inputParameters)).join('\n');
     }
}

function formatServiceInputParameter(inputParameter){
    if(inputParameter.type === 'array'){
        return (`-Name: ${inputParameter.name}, Type: ${inputParameter.type}<${inputParameter.format}>`);
    }
    else{
        return (`-Name: ${inputParameter.name}, Type: ${inputParameter.type}`);
     }
}

module.exports.countLinesInFile = (filePath) => {
    // Bug ... this code ignores the final line that does not end with a new line ... thats why leftovers was added
    return new Promise((resolve, reject) => {
        let count = 0;
        let leftovers = true;
        fs.createReadStream(filePath)
            .on('error', e => reject(e))
            .on('data', chunk => {
                for (let i=0; i < chunk.length; ++i) {
                    if (chunk[i] == 10) {
                        count++;
                        leftovers = false;
                    } else {
                        leftovers = true;
                    }
                }
            })
            .on('end', () => leftovers ? resolve(count + 1) : resolve(count) );
    });
};

module.exports.formatValidationPath = (p) => {
    let cnt = 0, res = '';
    const len = p.length;
    p.forEach(s => {
        if (_.isNumber(s)) {
            res += `[${s}]`
        } else if (cnt < len)
            res += s;
        else
            res += s;
        if (cnt < len - 1 && !_.isNumber(p[cnt + 1]))
            res += '.';
        cnt += 1;

    });
    return res;
};

module.exports.cleanInternalFields = function(jsobj) {
    return JSON.stringify(jsobj, function re(a, obj) {
        if (a.startsWith("_")) {
            return undefined;
        }
        return obj;
    }, 2);
};

module.exports.jsonToYaml = function (json) {
    if (typeof json == 'string') {
        json = JSON.parse(json);
    }
    return yaml.dump(json);
};

module.exports.writeToFile = function (content, filepath) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }

    fs.writeFileSync(filepath, content);
};

module.exports.fileExists = function (filepath) {
    return fs.existsSync(filepath)
};

// Alternatively, we can use fs.rmdirSync(<path>, {recursive: true}), but that requires node v12+
const deleteFolderRecursive = function(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            if (fs.lstatSync(filepath).isDirectory()) {
                fs.readdirSync(filepath).forEach((file, index) => {
                    const curPath = path.join(filepath, file);
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(filepath);
            } else {
                fs.unlinkSync(filepath);
            }
        }
    } catch (e) {
        console.error(chalk.red(e.message));
    }
};

module.exports.deleteFile = deleteFolderRecursive;

module.exports.checkProject = (projectId) => {
    if(_.isEmpty(projectId)){
        console.error(chalk.red('\'project\' is required, please provide using \'cortex configure\' or --project'));
        process.exit(1)
    }
}