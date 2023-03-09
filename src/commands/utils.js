import Table from 'cli-table3';
import _ from 'lodash';
import { boolean } from 'boolean';
import chalk from 'chalk';
import debugSetup from 'debug';
import fs from 'node:fs';
import process from 'node:process';
import { globSync } from 'glob';
import * as jmsepath from 'jmespath';
import path from 'node:path';
import yaml from 'js-yaml';
import { exec } from 'child_process';

const debug = debugSetup('cortex:cli');
const MAX_NAME_LENGTH = 20;
const space = /\s+/;
const specialCharsExceptHyphen = /[^A-Za-z0-9- ]/;
const beginAndEndWithHyphen = /^[-]+|[-]+$/;
const validationErrorMessage = 'Must be 20 characters or less, contain only lowercase a-z, 0-9, or -, and cannot begin or end with -';
const nameRequirementMessage = 'You must provide a name for the skill.';
export function useColor(options) {
    return boolean(options?.color);
}

export const printExtendedLogs = (data, options) => {
    if (options.limit && Array.isArray(data) && data.length === Number(options.limit) && options.limit !== '0') {
        // don't log if showing all the results
        process.stderr.write(`Results limited to ${options.limit} rows\n`);
    }
};

export function printError(message, options = { color: true }, exitProgram = true) {
    if (useColor(options)) {
        console.error(chalk.red(message));
    } else {
        console.error(message);
    }
    if (exitProgram) {
        process.exit(1);
    }
}
function _extractValues(fields, obj) {
    const rv = [];
    fields.forEach((f) => rv.push((obj !== undefined && obj !== null && obj[f] !== undefined && obj[f] !== null) ? obj[f].toString() : '-'));
    return rv;
}
/**
 * Execute a sub command, return stdout on success, return stderr on failure
 * @param commandStr
 * @returns {Promise<*>}
 */
// eslint-disable-next-line require-await
export async function callMe(commandStr) {
    return new Promise((resolve, reject) => {
        const proc = exec(commandStr, (err, stdout) => {
            if (err) {
                reject(Error(err.message + stdout));
            } else {
                resolve(stdout);
            }
        });
        // Pipe stdout to stderr in real time:
        proc.stdout.pipe(process.stderr);
    });
}
function round(value, precision) {
    const multiplier = 10 ** (precision || 0);
    return Math.floor(value * multiplier) / multiplier;
}
function formatServiceInputParameter(inputParameter) {
    if (inputParameter.type === 'array') {
        return (`-Name: ${inputParameter.name}, Type: ${inputParameter.type}<${inputParameter.format}>`);
    }
    return (`-Name: ${inputParameter.name}, Type: ${inputParameter.type}`);
}
// connections get returns createdAt (not prefixed by _) field that cause saving exported connection to fail. Hence removing them manually
const systemFields = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
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
export const constructError = (error) => {
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
export const printSuccess = (message, options) => {
    if (useColor(options)) {
        console.log(chalk.green(message));
    } else {
        console.log(message);
    }
};
export const printWarning = (message, options) => {
    if (useColor(options)) {
        console.log(chalk.yellow(message));
    } else {
        console.log(message);
    }
};
export function filterObject(obj, options) {
    try {
        if (options.query) {
            debug(`filtering results with query: ${options.query}`);
            return jmsepath.search(obj, options.query);
        }
    } catch (e) {
        // TODO remove --query on deprecation
        process.stderr.write(`error: invalid argument: ${options.query} \n`);
    }
    return obj;
}
export const getQueryOptions = (options) => {
    // TODO remove --query on deprecation
    if (options.query) process.stderr.write('[DEPRECATION WARNING] --query\n');
    if (options.query && options.json && typeof (options.json) === 'string') process.stderr.write('Warning! --query overrides --json args\n');
    // make --query override --json
    const queryOptions = options.query || options.json;
    // output JSON if JSMEpath isn't passed, default value is true
    // set searchPath to null if there's no path
    return { query: queryOptions === true ? null : queryOptions };
};
export const getFilteredOutput = (result, options) => {
    const filteredResult = filterObject(result, getQueryOptions(options));
    if (filteredResult) {
        // print extended logs iff --query arg is valid
        printExtendedLogs(filteredResult, options);
        printSuccess(JSON.stringify(filteredResult, null, 2), options);
    }
};
export function filterListObject(obj, options) {
    const { map, pick, partialRight } = _;
    if (options.query) {
        debug(`filtering results with query: ${options.query}`);
        return map(obj, partialRight(pick, options.query.split(',')));
    }
    return obj;
}
export const parseObject = (str) => yaml.load(str);
export function printTable(spec, objects, transform) {
    const fn = transform ?? ((obj) => obj);
    const head = spec.map((s) => s.column);
    const colWidths = spec.map((s) => s.width);
    const fields = spec.map((s) => s.field);
    const values = objects.map((obj) => _extractValues(fields, fn(obj)));
    debug('printing fields: %o', fields);
    const table = new Table({ head, colWidths, style: { head: ['cyan'] } });
    values.forEach((v) => table.push(v));
    console.log(table.toString());
}
export const getSourceFiles = (source, cb) => {
    const options = { silent: true };
    const normalizedSource = (source.endsWith('/')) ? source : `${source}/`;
    const normalizedPath = path.posix.join(normalizedSource, '**', '*');
    globSync(normalizedPath, options, (err, files) => {
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
export const humanReadableFileSize = (sizeInBytes) => {
    const ranges = {
        K: 10 ** 3,
        M: 10 ** 6,
        G: 10 ** 9,
        T: 10 ** 12,
    };
    if (sizeInBytes < ranges.K) {
        return `${sizeInBytes}B`;
    }
    if (sizeInBytes < ranges.M) {
        return `${round(sizeInBytes / ranges.K, 1)}K`;
    }
    if (sizeInBytes < ranges.G) {
        return `${round(sizeInBytes / ranges.M, 1)}M`;
    }
    if (sizeInBytes < ranges.T) {
        return `${round(sizeInBytes / ranges.G, 1)}G`;
    }
    return sizeInBytes; // Umm fix logic
};
export const formatAllServiceInputParameters = (allParameters) => {
    if (allParameters.$ref != null) {
        return `$ref:${allParameters.$ref}`;
    }
    return allParameters.map((inputParameters) => formatServiceInputParameter(inputParameters)).join('\n');
};
export const countLinesInFile = (filePath) => new Promise((resolve, reject) => {
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
export const formatValidationPath = (p) => {
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
export const cleanInternalFields = (jsobj) => JSON.stringify(jsobj, (a, obj) => {
    if (a.startsWith('_') || systemFields.includes(a)) {
        return undefined;
    }
    return obj;
}, 2);
export const jsonToYaml = (json) => {
    if (typeof json === 'string') {
        json = JSON.parse(json);
    }
    return yaml.dump(json);
};
export const createFileStream = (filepath) => {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return fs.createWriteStream(filepath);
};
export const writeToFile = (content, filepath) => {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, content);
};
export const fileExists = (filepath) => fs.existsSync(filepath);
export const checkProject = (projectId) => {
    if (_.isEmpty(projectId)) {
        printError('\'project\' is required, please provide using \'cortex configure\' or --project');
    }
};
export const LISTTABLEFORMAT = [
    { column: 'Name', field: 'name', width: 30 },
    { column: 'Title', field: 'title', width: 40 },
    { column: 'Description', field: 'description', width: 50 },
    { column: 'Modified', field: 'updatedAt', width: 26 },
    { column: 'Author', field: 'createdBy', width: 25 },
];
export const DEPENDENCYTABLEFORMAT = [
    { column: 'Dependency Name', field: 'name', width: 60 },
    { column: 'Dependency Type', field: 'type', width: 40 },
];
export const OPTIONSTABLEFORMAT = [
    { column: 'Option Type', field: 'type', width: 20 },
    { column: 'Message', field: 'message', width: 120 },
];
export const RUNTABLEFORMAT = [
    { column: 'Run ID', field: 'runId', width: 30 },
    { column: 'Experiment Name', field: 'experimentName', width: 40 },
    { column: 'Took', field: 'took', width: 50 },
    { column: 'Modified', field: '_updatedAt', width: 26 },
];
export const SESSIONTABLEFORMAT = [
    { column: 'Session ID', field: 'sessionId', width: 45 },
    { column: 'TTL', field: 'ttl', width: 15 },
    { column: 'Description', field: 'description', width: 70 },
];
export const isNumeric = (value) => /^-?\d+$/.test(value);
export const CONNECTIONTABLEFORMAT = [
    { column: 'Name', field: 'name', width: 40 },
    { column: 'Title', field: 'title', width: 50 },
    { column: 'Description', field: 'description', width: 50 },
    { column: 'Connection Type', field: 'connectionType', width: 25 },
    { column: 'Created On', field: 'createdAt', width: 26 },
];
export const EXTERNALROLESFORMAT = [
    { column: 'Group', field: 'group' },
    { column: 'Roles', field: 'roles' },
];
export const generateNameFromTitle = (title) => title.replace(specialCharsExceptHyphen, '')
    .replace(space, '-')
    .replace(beginAndEndWithHyphen, '')
    .substr(0, MAX_NAME_LENGTH)
    .replace(beginAndEndWithHyphen, '')
    .toLowerCase();
export const hasUppercase = (s) => /[A-Z]/.test(s);
export const validateName = (name) => (space.test(name)
    || specialCharsExceptHyphen.test(name)
    || beginAndEndWithHyphen.test(name)
    || (!name)
    || (name && name.length > MAX_NAME_LENGTH)
    || hasUppercase(name)
    ? {
        status: false,
        message: name ? validationErrorMessage : nameRequirementMessage,
    }
    : {
        status: true,
        message: '',
    });
export const handleTable = (spec, data, transformer, noDataMessage) => {
    if (!data || data.length === 0) {
        printSuccess(noDataMessage);
    } else {
        printTable(spec, data, transformer);
    }
};

export const handleListFailure = (response, options, type) => {
    if (response.status === 400) {
        const optionTableFormat = OPTIONSTABLEFORMAT;
        printError(`${type} list failed.`, options, false);
        if (response.details !== undefined && response.details !== null) {
            printTable(optionTableFormat, response.details);
        } else {
            printError(response.message, options);
        }
        printError(''); // Just exit
    }
    return printError(`Failed to list ${type}: ${response.status} ${response.message}`, options);
};
export const handleDeleteFailure = (response, options, type) => {
    if (response.status === 403) { // has dependencies
        const tableFormat = DEPENDENCYTABLEFORMAT;
        printError(`${type} deletion failed: ${response.message}.`, options, false);
        printTable(tableFormat, response.details);
        return printError(''); // Just exit
    }
    const defaultErrorMessage = `${type} deletion failed: ${response.status} ${response.message}.`;
    return printError(defaultErrorMessage, options);
};
export { deleteFolderRecursive as deleteFile };
