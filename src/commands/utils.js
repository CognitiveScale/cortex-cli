import Table from 'cli-table3';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { HTTPError } from 'got';
import { boolean } from 'boolean';
import chalk from 'chalk';
import debugSetup from 'debug';
import fs from 'node:fs';
import process from 'node:process';
import { globSync } from 'glob';
import { fileURLToPath } from 'node:url';
import * as jmsepath from 'jmespath';
import path from 'node:path';
import yaml from 'js-yaml';
import { exec } from 'node:child_process';

const debug = debugSetup('cortex:cli');
const MAX_NAME_LENGTH = 20;
const space = /\s+/;
const validNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9]$/;
const specialCharsExceptHyphen = /[^A-Za-z0-9- ]/;
const beginAndEndWithHyphen = /^[-]+|[-]+$/;
const validationErrorMessage = 'Must be 20 characters or less, contain only alphanumeric characters, or -, and cannot begin with a number and cannot begin or end with -';
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

export const printSuccess = (message, options) => {
    if (useColor(options)) {
        console.log(chalk.green(message));
    } else {
        console.log(message);
    }
};
export const printWarning = (message, options) => {
    if (useColor(options)) {
        console.warn(chalk.yellow(message));
    } else {
        console.warn(message);
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

// TODO replace with handleError, to reduce duplicate code.
export const constructError = (error) => {
    let details;
    let respCode;
    // fallback to text in message or standard error message
    const errResp = error?.response;
    let errorText = errResp?.body;
    if (errorText?.trim().length === 0 || error.name === 'RequestError') {
        errorText = error.message;
    } else if (error.name === 'ParseError' || error.code === 'ERR_BODY_PARSE_FAILURE') {
        errorText = 'Unable to parse response from server. Try running again with "--debug" for more details.';
        details = error.message;
    }
    // if JSON was returned, look for either a message or error in it
    try {
        const resp = errResp ? JSON.parse(errorText) : {};
        respCode = resp.code;
        if (resp?.message || resp?.error) errorText = resp?.message || resp?.error;
        // eslint-disable-next-line prefer-destructuring
        details = details || resp.details;
    } catch (e) {
        // Guess it wasn't JSON!
    }
    // todo make figuring out the status code more consistent? this might be a holdover from request vs got?
    const status = errResp?.statusCode || respCode || error?.code || error?.status || '';
    return {
        success: false, message: errorText, details, status,
    };
};
export function writeToFile(content, filepath, createDir = true) {
    const dir = path.dirname(filepath);
    if (createDir && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, content);
}

/**
 * If provided write to file otherwise dump to stdout
 * @param content
 * @param opts - expects `outputFile` property or dumps to stdout
 */
export function writeOutput(content, opts) {
    if (opts?.outputFile) {
        return writeToFile(content, opts.outputFile);
    }
    return printSuccess(content, opts);
}

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
        writeOutput(JSON.stringify(filteredResult, null, 2), options);
    }
};

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

export function getSourceFiles(source) {
    const options = { silent: true };
    const normalizedSource = (source.endsWith('/')) ? source : `${source}/`;
    const normalizedPath = path.posix.join(normalizedSource, '**', '*');
    const files = globSync(normalizedPath, options);
    // files is an array of filenames.
    return files.filter((fpath) => fs.lstatSync(fpath).isFile()).map((fpath) => ({
        canonical: fpath,
        relative: path.relative(normalizedSource, fpath),
        size: fs.lstatSync(fpath).size,
    }));
}

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
    let res = json;
    if (typeof json === 'string') {
        res = JSON.parse(json);
    }
    return yaml.dump(res);
};
export const createFileStream = (filepath) => {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return fs.createWriteStream(filepath);
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
export const validateName = (name) => (validNameRegex.test(name) && (name.length <= MAX_NAME_LENGTH)
    ? {
        status: true,
        message: '',
    }
    : {
        status: false,
        message: name ? validationErrorMessage : nameRequirementMessage,
    });
export const handleTable = (spec, data, transformer, noDataMessage) => {
    if (!data || data.length === 0) {
        printSuccess(noDataMessage);
    } else {
        printTable(spec, data, transformer);
    }
};

const transformTSOAValidation = (responseDetails) => {
    if (responseDetails && typeof responseDetails === 'object') {
        const keys = Object.keys(responseDetails);
        if (keys.length > 0) {
            const transformedResp = [];
            for (let i = 0; i < keys.length; i += 1) {
                const key = keys[i];
                const { message } = _.get(responseDetails, key, {});

                // If the key includes a single dot (.)
                if (key.includes('.') && key.split('.').length === 2) {
                    if (message) {
                        // Transform error object
                        transformedResp.push({ type: key.split('.')[1], message });
                    }
                    // If key doesn't include a period dot (.)
                } else if (!key.includes('.')) {
                    transformedResp.push({ type: key, message });
                }
            }
            if (transformedResp.length > 0) {
                return transformedResp;
            }
            return null;
        }
    }
    // Handle invalid or unexpected input
    return null;
};

export const handleListFailure = (err, options, type) => {
    let status;
    let message;
    let details;
    // Newer code throws got HTTPError
    if (err instanceof HTTPError) {
        status = err.response.statusCode;
        const jsonResp = JSON.parse(err.response.body ?? '{}');
        details = jsonResp.details;
        message = jsonResp.message;
    } else {
        status = err.status ?? '';
        message = err.message;
        details = err.details;
    }

    if (status === 400) {
        printError(`${type} list failed.`, options, false);
        if (details !== undefined && details !== null) {
            // TSOA API validation error case
            if (!Array.isArray(details)) {
                const transformedResponse = transformTSOAValidation(details);
                if (transformedResponse !== null) {
                    details = transformedResponse;
                }
            }
            printTable(OPTIONSTABLEFORMAT, details);
        } else {
            printError(message, options);
        }
        printError(''); // Just exit
    }
    return printError(`Failed to list ${type}: ${status} ${message}`, options);
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


export function readPackageJSON(relPath) {
    const absPath = fileURLToPath(new URL(relPath, import.meta.url));
    return JSON.parse(fs.readFileSync(absPath));
}

/**
 * pretty print the 400 response from TSOA router
 */
export function printErrorDetails(response, options, exit = true) {
    let details = response?.details;
    if (!details && response?.body) {
        details = parseObject(response?.body)?.details;
    }
    if (!details) return; // nothing to process...
    printWarning('The following issues were found:', options);
    const tableSpec = [
        { column: 'Path', field: 'path', width: 50 },
        { column: 'Message', field: 'message', width: 100 },
    ];
    if (_.isArray(details)) {
        details.map((d) => d.path = formatValidationPath(d.path));
    } else {
        details = Object.entries(details).map(([path2, body]) => ({ path: path2, message: body?.message }));
    }
    printTable(tableSpec, details);
    if (exit) printError(''); // Just use this over exit() as tests already stub this call ..
}

function checkForEmptyString(key, value) {
    if (!value.trim()) {
      printError(`error: <${key}> cannot be empty.`);
      process.exit(1); // Exit with an error code
    }
  }

export function checkForEmptyArgs(args) {
    Object.keys(args).forEach((key) => {
      if (typeof args[key] === 'object') {
        args[key].forEach((val) => {
            checkForEmptyString(key, val);
        });
      } else {
            checkForEmptyString(key, args[key]);
      }
    });
  }

// Yet another error handling function, need to rationalize these
export function handleError(error, options, prefix = 'Error') {
    let details;
    let respCode;
    // fallback to text in message or standard error message
    const errResp = error?.response;
    let errorText = errResp?.body;
    if (errorText?.trim().length === 0 || error.name === 'RequestError') {
        errorText = error.message;
    } else if (error.name === 'ParseError' || error.code === 'ERR_BODY_PARSE_FAILURE') {
        errorText = 'Unable to parse response from server. Try running again with "--debug" for more details.';
        details = error.message;
    }
    // if JSON was returned, look for either a message or error in it
    try {
        const resp = errResp ? JSON.parse(errorText) : {};
        respCode = resp.code;
        if (resp?.message || resp?.error) errorText = resp?.message || resp?.error;
        // eslint-disable-next-line prefer-destructuring
        details = resp.details;
    } catch (e) {
        // Guess it wasn't JSON!
    }
    // todo make figuring out the status code more consistent? this might be a holdover from request vs got?
    const status = errResp?.statusCode || respCode || error?.code || error?.status || '';
    printError(`${prefix}: ${status}, ${errorText}`, undefined, false);
    if (details !== undefined && details !== null) {
        // TSOA API validation error case
        if (!Array.isArray(details)) {
            const transformedResponse = transformTSOAValidation(details);
            if (transformedResponse !== null) {
                details = transformedResponse;
            }
        }
        printTable(OPTIONSTABLEFORMAT, details);
    }
    printError(''); // Just exit
}

export { deleteFolderRecursive as deleteFile };
