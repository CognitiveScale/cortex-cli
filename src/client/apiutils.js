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
const gotExt = got.extend({
    followRedirect: false,
    // Put a reasonable timeout
    timeout: {
        lookup: 100,
        connect: 50,
        secureConnect: 100,
        socket: 1000,
// Validate these unsafe with content uploads
       send: 10000,
       response: 2000,
    },
    retry: {
        limit: 0, // no retries - fail fast ( TODO always ? )
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
});
export const defaultHeaders = (token, otherHeaders = {}) => ({ Authorization: `Bearer ${token}`, 'user-agent': getUserAgent(), ...otherHeaders });
export { getUserAgent };
export { gotExt as got };
