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

const Table = require('cli-table3');
const _ = require('lodash');
const chalk = require('chalk');
const debug = require('debug')('cortex:cli');
const findPackageJson = require('find-package-json');
const fs = require('fs');
const glob = require('glob');
const jmsepath = require('jmespath');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const { exec } = require('child_process');
const { ALLOWED_QUERY_FIELDS } = require('../constants');

const MAX_NAME_LENGTH = 20;

const space = /\s+/g;
const specialCharsExceptHyphen = /[^A-Za-z0-9- ]/g;
const beginAndEndWithHyphen = /^[-]+|[-]+$/g;
const vaildationErrorMessage = "Must contain only lowercase a-z, 0-9, or -, and it can't begin or end with -";
const suffixLength = 6;

module.exports.constructError = (error) => {
    // fallback to text in message or standard error message
    const errResp = error.response;
    let errorText = _.get(errResp, 'body');
    if (_.isEmpty(errorText) || error.name === 'RequestError') {
        errorText = error.message;
    }
    let details;
    let respCode;
    // if JSON was returned, look for either a message or error in it
    try {
        const resp = errResp ? JSON.parse(errorText) : {};
        respCode = resp.code;
        if (resp.message || resp.error) errorText = resp.message || resp.error;
        // eslint-disable-next-line prefer-destructuring
        details = resp.details;
    } catch (e) {
        // Guess it wasn't JSON!
    }
    // todo make figuring out the status code more consistent? this might be a holdover from request vs got?
    const status = _.get(errResp, 'statusCode') || respCode || error.code || error.status || '';
    return {
 success: false, message: errorText, details, status,
};
};

module.exports.printSuccess = (message, options) => {
    if (!options || options.color === 'on') {
        console.log(chalk.green(message));
    } else {
        console.log(message);
    }
};

module.exports.printWarning = (message, options) => {
    if (!options || options.color === 'on') {
        console.log(chalk.yellow(message));
    } else {
        console.log(message);
    }
};

function printError(message, options, exit = true) {
    if (!options || options.color === 'on') {
        console.error(chalk.red(message));
    } else {
        console.error(message);
    }
    // Don't exit when testing as this breaks negative unit tests
    if (exit && _.toLower(process.env.NODE_ENV) !== 'test') {
        process.exit(1);
    }
}
module.exports.printError = printError;

module.exports.filterObject = (obj, options) => {
    if (options.query) {
        debug(`filtering results with query: ${options.query}`);
        return jmsepath.search(obj, options.query);
    }
    return obj;
};

module.exports.filterListObject = (obj, options) => {
    const { map, pick, partialRight } = _;
    if (options.query) {
        debug(`filtering results with query: ${options.query}`);
        return map(obj, partialRight(pick, options.query.split(',')));
    }
    return obj;
};

// YAML 1.2 parses both yaml & json
module.exports.parseObject = (str) => yaml.load(str);

function _extractValues(fields, obj) {
    const rv = [];
    fields.forEach((f) => rv.push((obj !== undefined && obj !== null && obj[f] !== undefined && obj[f] !== null) ? obj[f].toString() : '-'));
    return rv;
}

module.exports.printTable = (spec, objects, transform) => {
    transform = transform || function (obj) { return obj; };

    const head = spec.map((s) => s.column);
    const colWidths = spec.map((s) => s.width);
    const fields = spec.map((s) => s.field);
    const values = objects.map((obj) => _extractValues(fields, transform(obj)));
    debug('printing fields: %o', fields);

    const table = new Table({ head, colWidths, style: { head: ['cyan'] } });
    values.forEach((v) => table.push(v));

    console.log(table.toString());
};

/**
 * Execute a sub command, return stdout on success, return stderr on failure
 * @param commandStr
 * @returns {Promise<*>}
 */
// eslint-disable-next-line require-await
async function callMe(commandStr) {
    return new Promise((resolve, reject) => {
        const proc = exec(commandStr, (err, stdout) => {
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

module.exports.getSourceFiles = (source, cb) => {
    const options = { silent: true };
    const normalizedSource = (source.endsWith('/')) ? source : `${source}/`;
    const normalizedPath = path.join(normalizedSource, '**', '*');
    glob(normalizedPath, options, (err, files) => {
        // files is an array of filenames.
        if (err) {
            cb(err, null);
        } else {
            const results = files.filter((fpath) => fs.lstatSync(fpath).isFile()).map((fpath) => ({
                    canonical: fpath,
                    relative: path.relative(normalizedSource, fpath),
                    size: fs.lstatSync(fpath).size,
                }));
            cb(null, results);
        }
    });
};

function round(value, precision) {
    const multiplier = 10 ** (precision || 0);
    return Math.floor(value * multiplier) / multiplier;
}

module.exports.humanReadableFileSize = (sizeInBytes) => {
    const ranges = {
        K: 10 ** 3,
        M: 10 ** 6,
        G: 10 ** 9,
        T: 10 ** 12,
    };
    if (sizeInBytes < ranges.K) {
        return `${sizeInBytes}B`;
    } if (sizeInBytes < ranges.M) {
        return `${round(sizeInBytes / ranges.K, 1)}K`;
    } if (sizeInBytes < ranges.G) {
        return `${round(sizeInBytes / ranges.M, 1)}M`;
    } if (sizeInBytes < ranges.T) {
        return `${round(sizeInBytes / ranges.G, 1)}G`;
    }
    return sizeInBytes; // Umm fix logic
};

function formatServiceInputParameter(inputParameter) {
    if (inputParameter.type === 'array') {
        return (`-Name: ${inputParameter.name}, Type: ${inputParameter.type}<${inputParameter.format}>`);
    }

    return (`-Name: ${inputParameter.name}, Type: ${inputParameter.type}`);
}

module.exports.formatAllServiceInputParameters = (allParameters) => {
     if (allParameters.$ref != null) {
         return `$ref:${allParameters.$ref}`;
     }

         return allParameters.map((inputParameters) => formatServiceInputParameter(inputParameters)).join('\n');
};

module.exports.countLinesInFile = (filePath) => new Promise((resolve, reject) => {
    // Bug ... this code ignores the final line that does not end with a new line ... thats why leftovers was added
    // eslint-disable-next-line implicit-arrow-linebreak
        let count = 0;
        let leftovers = true;
        fs.createReadStream(filePath)
            .on('error', (e) => reject(e))
            .on('data', (chunk) => {
                for (let i = 0; i < chunk.length; i += 1) {
                    if (chunk[i] === 10) {
                        count += 1;
                        leftovers = false;
                    } else {
                        leftovers = true;
                    }
                }
            })
            .on('end', () => (leftovers ? resolve(count + 1) : resolve(count)));
    });
module.exports.formatValidationPath = (p) => {
    let cnt = 0;
    let res = '';
    const len = p.length;
    p.forEach((s) => {
        if (_.isNumber(s)) {
            res += `[${s}]`;
        } else if (cnt < len) res += s;
        else res += s;
        if (cnt < len - 1 && !_.isNumber(p[cnt + 1])) res += '.';
        cnt += 1;
    });
    return res;
};

// connections get returns createdAt (not prefixed by _) field that cause saving exported connection to fail. Hence removing them manually
const systemFields = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
module.exports.cleanInternalFields = (jsobj) => JSON.stringify(jsobj, (a, obj) => {
        if (a.startsWith('_') || systemFields.includes(a)) {
            return undefined;
        }
        return obj;
    }, 2);

module.exports.jsonToYaml = (json) => {
    if (typeof json === 'string') {
        json = JSON.parse(json);
    }
    return yaml.dump(json);
};

module.exports.createFileStream = (filepath) => {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return fs.createWriteStream(filepath);
};

module.exports.writeToFile = (content, filepath) => {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, content);
};

module.exports.fileExists = (filepath) => fs.existsSync(filepath);

// Alternatively, we can use fs.rmdirSync(<path>, {recursive: true}), but that requires node v12+
const deleteFolderRecursive = (filepath) => {
    try {
        if (fs.existsSync(filepath)) {
            if (fs.lstatSync(filepath).isDirectory()) {
                fs.readdirSync(filepath).forEach((file) => {
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
    if (_.isEmpty(projectId)) {
        printError('\'project\' is required, please provide using \'cortex configure\' or --project');
    }
};

const pkg = findPackageJson(__dirname).next().value;
module.exports.getUserAgent = function getUserAgent() {
    return `${pkg.name}/${pkg.version} (${os.platform()}; ${os.arch()}; ${os.release()}; ${os.platform()})`;
};

module.exports.LISTTABLEFORMAT = [
    { column: 'Name', field: 'name', width: 30 },
    { column: 'Title', field: 'title', width: 40 },
    { column: 'Description', field: 'description', width: 50 },
    { column: 'Modified', field: 'updatedAt', width: 26 },
    { column: 'Author', field: 'createdBy', width: 25 },
];

module.exports.DEPENDENCYTABLEFORMAT = [
    { column: 'Dependency Name', field: 'name', width: 60 },
    { column: 'Dependency Type', field: 'type', width: 40 },
];

module.exports.OPTIONSTABLEFORMAT = [
    { column: 'Option Type', field: 'type', width: 20 },
    { column: 'Message', field: 'message', width: 120 },
];

module.exports.RUNTABLEFORMAT = [
    { column: 'Run ID', field: 'runId', width: 30 },
    { column: 'Experiment Name', field: 'experimentName', width: 40 },
    { column: 'Took', field: 'took', width: 50 },
    { column: 'Modified', field: '_updatedAt', width: 26 },
];
module.exports.SESSIONTABLEFORMAT = [
    { column: 'Session ID', field: 'sessionId', width: 45 },
    { column: 'TTL', field: 'ttl', width: 15 },
    { column: 'Description', field: 'description', width: 70 },
];

module.exports.isNumeric = (value) => /^-?\d+$/.test(value);

module.exports.CONNECTIONTABLEFORMAT = [
    { column: 'Name', field: 'name', width: 40 },
    { column: 'Title', field: 'title', width: 50 },
    { column: 'Description', field: 'description', width: 50 },
    { column: 'Connection Type', field: 'connectionType', width: 25 },
    { column: 'Created On', field: 'createdAt', width: 26 },
];

module.exports.EXTERNALROLESFORMAT = [
    { column: 'Group', field: 'group' },
    { column: 'Roles', field: 'roles' },
];

module.exports.generateNameFromTitle = (title) => title.replace(specialCharsExceptHyphen, '')
        .replace(space, '-')
        .replace(beginAndEndWithHyphen, '')
        .substr(0, MAX_NAME_LENGTH - suffixLength)
        .replace(beginAndEndWithHyphen, '')
        .toLowerCase();

module.exports.hasUppercase = (s) => /[A-Z]/.test(s);

module.exports.validateName = (name) => (space.test(name) 
|| specialCharsExceptHyphen.test(name)
|| beginAndEndWithHyphen.test(name)
|| (name && name.length > MAX_NAME_LENGTH)
|| module.exports.hasUppercase(name)
    ? {
        status: false,
        message: vaildationErrorMessage,
    }
    : {
        status: true,
        message: '',
    });

module.exports.handleTable = (spec, data, transformer, noDataMessage) => {
    if (!data || data.length === 0) {
        this.printSuccess(noDataMessage);
    } else {
        this.printTable(spec, data, transformer);
    }
};

// Todo: move to cortex-express-common FAB-4008
module.exports.validateOptions = (options, type) => {
    const {
        filter, limit, skip, sort,
    } = options;
    const errorDetails = [];
    if (filter) {
        try {
            const filterObj = JSON.parse(filter);
            const filterKeys = Object.keys(filterObj);
            if (typeof (filterObj) !== 'object') {
                errorDetails.push({ type: 'filter', message: 'Invalid filter expression' });
            }
            if (type && (_.intersection(ALLOWED_QUERY_FIELDS[type].filter, filterKeys)).length !== filterKeys.length) {
                errorDetails.push({ type: 'filter', message: `Invalid filter params. Allowed fields: ${ALLOWED_QUERY_FIELDS[type].filter}` });
            }
        } catch (err) {
            errorDetails.push({ type: 'filter', message: `Invalid filter expression: ${err.message}` });
        }
    }
    if (sort) {
        try {
            const sortObj = JSON.parse(sort);
            const sortKeys = Object.keys(sortObj);
            const sortValues = Object.values(sortObj);
            if (typeof (sortObj) !== 'object') {
                errorDetails.push({ type: 'sort', message: 'Invalid sort expression' });
            }
            if (!sortValues.every((val) => Number(val) === 1 || Number(val) === -1)) {
                errorDetails.push({ type: 'sort', message: 'Sort values can only be 1(ascending) or -1(descending)' });
            }
            if (type && (_.intersection(ALLOWED_QUERY_FIELDS[type].sort, sortKeys)).length !== sortKeys.length) {
                errorDetails.push({ type: 'sort', message: `Invalid sort params. Allowed fields: ${ALLOWED_QUERY_FIELDS[type].sort}` });
            }
        } catch (err) {
            // check if a string of 'asc' or 'desc' is provided for backwards compatibility
            if (!(_.lowerCase(sort).startsWith('desc') || _.lowerCase(sort).startsWith('asc'))) {
                errorDetails.push({ type: 'sort', message: `Invalid sort expression: ${err.message}` });
            }
        }
    }
    if ((limit && _.isNaN(Number(limit))) || Number(limit) <= 0) {
        errorDetails.push({ type: 'limit', message: 'Invalid limit, limit should be a valid positive number' });
    }
    if ((skip && _.isNaN(Number(skip))) || Number(skip) < 0) {
        errorDetails.push({ type: 'skip', message: 'Invalid skip, skip should be a valid non negative number' });
    }
    if (errorDetails.length) {
        return { validOptions: false, errorDetails };
    }
    return {
        validOptions: true, errorDetails,
    };
};

module.exports.printExtendedLogs = (data, options) => {
    if (options.limit && Array.isArray(data) && data.length === Number(options.limit)) {
        // don't log if showing all the results
        console.log(`Results limited to ${options.limit} rows`);
    }
};
