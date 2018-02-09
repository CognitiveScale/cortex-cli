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

const fs = require('fs');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Processors = require('../client/processors');
const { printSuccess, printError, filterObject, parseObject } = require('./utils');

module.exports.ListRuntimesCommand = class ListRuntimesCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.executeListRuntimes()', options.profile);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);

        processors.listRuntimes(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.runtimes, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to list runtimes: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to list runtimes: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListRuntimeTypesCommand = class ListRuntimeTypesCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.executeListRuntimeTypes()', options.profile);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);

        processors.listRuntimeTypes(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.runtimeTypes, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to list runtime types: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to list runtime types: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListActionsCommand = class ListActionsCommand {

    constructor(program) {
        this.program = program;
    }

    execute(runtimeName, options) {
        debug('%s.executeListRuntimeActionss()', options.profile);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);

        processors.listRuntimeActions(profile.token, runtimeName).then((response) => {
            if (response.success) {
                let result = filterObject(response.actions, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to list actions for runtime ${runtimeName}: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to list actions for runtime ${runtimeName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeRuntimeCommand = class DescribeRuntimeCommand {

    constructor(program) {
        this.program = program;
    }

    execute(runtimeName, options) {
        debug('%s.executeDescribeRuntime(%s)', options.profile, runtimeName);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);

        processors.describeRuntime(profile.token, runtimeName).then((response) => {
            if (response.success) {
                let result = filterObject(response.runtime, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe processor runtime ${runtimeName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe processor runtime ${runtimeName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DeleteRuntimeCommand = class DeleteRuntimeCommand {

    constructor(program) {
        this.program = program;
    }

    execute(runtimeName, options) {
        debug('%s.executeDeleteRuntime(%s)', options.profile, runtimeName);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);

        processors.deleteRuntime(profile.token, runtimeName).then((response) => {
            if (response.success) {
                printSuccess(`Processor runtime ${runtimeName} deleted`);
            }
            else {
                printError(`Failed to delete processor runtime ${runtimeName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to delete processor runtime ${runtimeName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.SaveRuntimeCommand = class SaveRuntimeCommand {

    constructor(program) {
        this.program = program;
    }

    execute(runtimeDefinition, options) {
        debug('%s.executeSaveRuntime(%s)', options.profile, runtimeDefinition);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);

        const runtimeStr = fs.readFileSync(runtimeDefinition);
        const runtime = parseObject(runtimeStr, options);

        processors.saveRuntime(profile.token, runtime).then((response) => {
            if (response.success) {
                printSuccess(`Processor runtime configuration saved at version ${response.version}`, options);
            }
            else {
                printError(`Failed to save processor runtime: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to save processor runtime: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.InvokeActionCommand = class InvokeActionCommand {

    constructor(program) {
        this.program = program;
    }

    execute(runtimeName, actionId, options) {
        debug('%s.executeInvokeAction(%s, %s)', options.profile, runtimeName, actionId);
        const profile = loadProfile(options.profile);
        const processors = new Processors(profile.url);

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
                printError(`Action invocation failed: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to invoke action: ${err.status} ${err.message}`, options);
        });
    }
};