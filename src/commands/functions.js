const fs = require('fs');
const uuid = require('uuid');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Processors = require('../client/processors');
const { printSuccess, printError, filterObject, parseObject } = require('./utils');
const { exec } = require('child_process');

module.exports.ListFunctionsCommand = class ListFunctionsCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.executeListFunctions()', options.profile);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);
        const runtimeName = 'cortex/default';

        processors.listRuntimeActions(profile.token, runtimeName).then((response) => {
            if (response.success) {
                let result = filterObject(response.actions, options);
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

module.exports.DeployFunctionCommand = class DeployFunctionCommand {

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
                printError(`Failed to deploy function: ${err}`);
                return;
            }
            printSuccess(`Function ${actionId} deployed`, options);
        });
    }
};

module.exports.InvokeFunctionCommand = class InvokeFunctionCommand {

    constructor(program) {
        this.program = program;
    }

    execute(actionId, options) {
        debug('executeInvokeFunction(%s, %s)', options.profile, actionId);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);
        const runtimeName = 'cortex/default';

        let params = {};
        if (options.params) {
            params = parseObject(options.params, options);
        }
        else if (options.paramsFile) {
            const paramsStr = fs.readFileSync(options.paramsFile);
            params = parseObject(paramsStr, options);
        }
        
        if (!params.token) params.token = profile.token;
        if (!params.apiEndpoint) params.apiEndpoint = profile.url;
        if (!params.instanceId) params.instanceId = uuid();
        if (!params.sessionId) params.sessionId = uuid();
        if (!params.channelId) params.channelId = uuid();

        debug('params: %o', params);

        processors.invokeRuntimeAction(profile.token, runtimeName, actionId, params).then((response) => {
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