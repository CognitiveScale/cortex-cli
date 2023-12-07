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
        lookup: 100,
        connect: 50,
        secureConnect: 100,
        socket: 1000,
        // send: 10000, // Not "SAFE" with large uploads
        response: 2000,
    },
    retry: {
        limit: 0, // no retries - fail fast
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

export function getTimeoutValues() {
    return [
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
    ];
}

export function getTimeoutUnit() {
    return 'ms';
}

function getEnvOptions() {
    function resolveTimeout(v) {
        // if its nullish -> keep the default
        // if its a positive number -> parse as an int, then apply to k
        // if its falsey or non-positive number -> use no timeout
        if (v == null) {
            return null; // use default
        }
        const value = parseInt(v, 10);
        if (value > 0) {
            return value; // user defined int
        }
        return false; // use no timeout
    }
    const timeout = {};
    const timeoutValues = getTimeoutValues();
    timeoutValues.forEach((t) => {
        const parsed = resolveTimeout(t.envValue);
        if (parsed !== false) {
            timeout[t.key] = parsed ?? t.defaultValue;
        }
    });
    return { ...gotOpts, timeout };
}

const gotExt = got.extend(getEnvOptions());
export const defaultHeaders = (token, otherHeaders = {}) => ({ Authorization: `Bearer ${token}`, ...otherHeaders });
export { gotExt as got };
