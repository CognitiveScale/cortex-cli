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
const Functions = require('../client/functions');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

module.exports.ListFunctionsCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListFunctions()', profile.name);

        const functions = new Functions(profile.url);
        functions.listFunctions(profile.token)
            .then((response) => {
                if (response.success) {
                    if (options.query || options.json) {
                        let result = filterObject(response.functions, options);
                        printSuccess(JSON.stringify(result, null, 2), options);
                    }
                    else {
                        const tableSpec = [
                            { column: 'Name', field: 'name', width: 50 },
                            { column: 'Image', field: 'image', width: 50 },
                            { column: 'Kind', field: 'kind', width: 25 },
                            { column: 'Created On', field: 'createdAt', width: 26 }
                        ];

                        printTable(tableSpec, response.functions);
                    }
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
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeFunction(%s)', profile.name, functionName);

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

module.exports.DeployFunctionCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(functionName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.deployFunction(%s)', profile.name, functionName);

        const kind = options.kind;
        const dockerImage = options.docker;
        const code = options.code;
        const memory = parseInt(options.memory);
        const timeout = parseInt(options.timeout);

        const functions = new Functions(profile.url);
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
        const profile = loadProfile(options.profile);
        debug('%s.executeInvokeFunction(%s)', profile.name, functionName);

        let params = {};
        if (options.params) {
            params = parseObject(options.params, options);
        }
        else if (options.paramsFile) {
            const paramsStr = fs.readFileSync(options.paramsFile);
            params = parseObject(paramsStr, options);
        }

        debug('params: %o', params);

        const functions = new Functions(profile.url);
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