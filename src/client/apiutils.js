import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import got from 'got';
import debugSetup from 'debug';
import os from 'os';
import { readPackageJSON } from '../commands/utils.js';

const pkg = readPackageJSON('../../package.json');

const debug = debugSetup('cortex:cli');
function getUserAgent() {
    return `${pkg.name}/${pkg.version} (${os.platform()}; ${os.arch()}; ${os.release()}; ${os.platform()})`;
}

const gotOpts = {
    followRedirect: false,
    // Put a reasonable timeout, see: https://github.com/sindresorhus/got/blob/main/documentation/6-timeout.md
    timeout: {
        lookup: 75, // greater than 100 not recommended
        connect: 400,
        secureConnect: 400,
        socket: 1000,
        // send: 10000, // Not "SAFE" with large uploads
        response: 2000,
    },
    retry: {
        limit: 3, // 3 retries
    },
    headers: {
        'user-agent': getUserAgent(),
    },
    hooks: {
        beforeRequest: [
            (options) => {
                if (debug.enabled) {
                    debug(`request url: ${options.url}`);
                    debug(`request methods: ${options.method}`);
                    debug(`request headers: ${JSON.stringify(options.headers)}`);
                    debug(`request json: ${JSON.stringify(options.json)}`);
                }
            },
        ],
        afterResponse: [
            (res) => {
                if (res.headers['x-auth-error']) {
                    res.statusCode = 401;
                    throw new Error(`Auth Error: ${res.headers['x-auth-error']}`);
                }
                if (debug.enabled) {
                    debug(`response http code: ${res.statusCode}`);
                    debug(`response headers: ${JSON.stringify(res.headers)}`);
                    debug(`response body: ${res.body}`);
                    debug(`response time(ms): ${JSON.stringify(_.get(res, 'timings.phases'))}`);
                }
                return res;
            },
        ],
    },
};

// TODO: convert to ES6 class (use getters, etc.) or Typescript?
function gotEnvValues() {
    return {
        timeout: [
            {
                envVar: 'CORTEX_TIMEOUT_LOOKUP',
                envValue: process.env.CORTEX_TIMEOUT_LOOKUP,
                defaultValue: gotOpts.timeout.lookup,
                key: 'lookup',
            },
            {
                envVar: 'CORTEX_TIMEOUT_CONNECT',
                envValue: process.env.CORTEX_TIMEOUT_CONNECT,
                defaultValue: gotOpts.timeout.connect,
                key: 'connect',
            },
            {
                envVar: 'CORTEX_TIMEOUT_SECURE_CONNECT',
                envValue: process.env.CORTEX_TIMEOUT_SECURE_CONNECT,
                defaultValue: gotOpts.timeout.secureConnect,
                key: 'secureConnect',
            },
            {
                envVar: 'CORTEX_TIMEOUT_SOCKET',
                envValue: process.env.CORTEX_TIMEOUT_SOCKET,
                defaultValue: gotOpts.timeout.socket,
                key: 'socket',
            },
            // {
            //     envVar: 'CORTEX_TIMEOUT_SEND',
            //     envValue: process.env.CORTEX_TIMEOUT_SEND,
            //     defaultValue: gotOpts.timeout.send,
            //     key: 'send',
            // },
            {
                envVar: 'CORTEX_TIMEOUT_RESPONSE',
                envValue: process.env.CORTEX_TIMEOUT_RESPONSE,
                defaultValue: gotOpts.timeout.response,
                key: 'response',
            },

        ],
        retry: [
            {
                envVar: 'CORTEX_API_RETRY',
                envValue: process.env.CORTEX_API_RETRY,
                defaultValue: gotOpts.retry.limit,
                key: 'limit',
            },
        ],
    };
}

export function getGotEnvOverrides() {
    function resolveNumericValue(v) {
        // if its nullish -> keep the default
        // if its a non-negative number -> parse as an int, then apply to k
        // if its falsey or not a number -> use no timeout
        if (v == null) {
            return null; // use default
        }
        const value = parseInt(v, 10);
        if (value >= 0) {
            return value; // user defined int
        }
        return false; // use no timeout
    }

    // NOTE: 'parsedValue' & 'userDefined' fields are resolved dynamically
    const values = gotEnvValues();
    Object.keys(values.timeout).forEach((k) => {
        // Parse each environment variable override. If result is (bool) false,
        // then the key should NOT be set. If it's nullish, then the user didn't
        // set a value.
        const entry = values.timeout[k];
        entry.parsedValue = resolveNumericValue(entry.envValue);
        entry.skipAssignment = (entry.parsedValue === false);
        entry.userDefined = (entry.parsedValue != null);
    });
    Object.keys(values.retry).forEach((k) => {
        // Ditto (from above).
        const entry = values.retry[k];
        entry.parsedValue = resolveNumericValue(entry.envValue);
        entry.skipAssignment = (entry.parsedValue === false);
        entry.userDefined = (entry.parsedValue != null);
    });
    debug('got Environment Variables: %s', JSON.stringify(values));
    return values;
}

export function getTimeoutUnit() {
    return 'ms';
}

function getEnvOptions() {
    const retry = {};
    const timeout = {};
    if (process.env.CORTEX_TIMEOUT_IGNORE) {
        debug('Ignoring all timeout configuration from env variables');
    } else {
        debug('Loading timeout configuration from env variables');
        const { timeout: timeoutValues, retry: retryValues } = getGotEnvOverrides();
        timeoutValues.forEach((t) => {
            if (!t.skipAssignment) {
                timeout[t.key] = t.parsedValue ?? t.defaultValue; // could use 'userDefined', but ?? is shorter
            }
        });
        retryValues.forEach((v) => {
            if (!v.skipAssignment) {
                retry[v.key] = v.parsedValue ?? v.defaultValue; // could use 'userDefined', but ?? is shorter
            }
        });
    }
    return { ...gotOpts, timeout, retry };
}

const gotExt = got.extend(getEnvOptions());
export const defaultHeaders = (token, otherHeaders = {}) => ({ Authorization: `Bearer ${token}`, ...otherHeaders });
export { gotExt as got };
