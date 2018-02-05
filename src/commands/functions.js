const fs = require('fs');
const uuid = require('uuid');
const debug = require('debug')('cortex:cli');
const {loadProfile} = require('../config');
const Functions = require('../client/functions');
const {printSuccess, printError, filterObject, parseObject} = require('./utils');
const {exec} = require('child_process');

module.exports.ListFunctionsCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.executeListFunctions()', options.profile);
        const profile = loadProfile(options.profile);
        const functions = new Functions(profile.url);

        functions.listFunctions(profile.token)
            .then((response) => {
                if (response.success) {
                    let result = filterObject(response.functions, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    printError(`Failed to list functions: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list functions: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeFunctionCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(functionName, options) {
        debug('%s.executeDescribeFunction(%s)', functionName, options.profile);
        const profile = loadProfile(options.profile);
        const functions = new Functions(profile.url);

        functions.describeFunction(profile.token, functionName, options.download !== undefined)
            .then((response) => {
                if (response.success) {
                    let result = filterObject(response.function, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    printError(`Failed to list functions: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list functions: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeployIBMCloudFunctionCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(actionId, options) {
        debug('deployFunction(%s, %s)', options.profile, actionId);
        const profile = loadProfile(options.profile);
        const kind = options.kind;
        const dockerImage = options.docker;
        const code = options.code;

        let cmd = `bx wsk action update ${actionId} ${code}`;
        if (kind) {
            cmd += ` --kind ${kind}`;
        }

        if (dockerImage) {
            cmd += ` --docker ${dockerImage}`;
        }

        debug('deploy command: %s', cmd);

        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                printError(`Failed to deploy function: ${err}`, options);
                return;
            }
            printSuccess(`Function ${actionId} deployed`, options);
        });
    }
};

module.exports.DeployFunctionCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(functionName, options) {
        debug('deployFunction(%s, %s)', options.profile, functionName);

        const profile = loadProfile(options.profile);
        const functions = new Functions(profile.url);

        const kind = options.kind;
        const dockerImage = options.docker;
        const code = options.code;
        const memory = parseInt(options.memory);
        const timeout = parseInt(options.timeout);

        functions.deployFunction(profile.token, functionName, dockerImage, kind, code, memory, timeout)
            .then((response) => {
                if (response.success) {
                    printSuccess(JSON.stringify(response.message, null, 2), options);
                }
                else {
                    printError(`Function deployment failed: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to deploy function: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.InvokeFunctionCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(functionName, options) {
        debug('executeInvokeFunction(%s, %s)', options.profile, functionName);
        const profile = loadProfile(options.profile);
        const functions = new Functions(profile.url);

        let params = {};
        if (options.params) {
            params = parseObject(options.params, options);
        }
        else if (options.paramsFile) {
            const paramsStr = fs.readFileSync(options.paramsFile);
            params = parseObject(paramsStr, options);
        }

        debug('params: %o', params);

        functions.invokeFunction(profile.token, functionName, params)
            .then((response) => {
                if (response.success) {
                    let result = filterObject(response.result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    printError(`Function invocation failed: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to invoke function: ${err.status} ${err.message}`, options);
            });
    }
};