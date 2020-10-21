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

const fs = require('fs');
const debug = require('debug')('cortex:cli');
const getOr = require('lodash/fp/getOr');
const isUndefined = require('lodash/fp/isUndefined');
const map = require('lodash/fp/map');

const { loadProfile } = require('../config');
const Variables = require('../client/variables');
const {
 printSuccess, printError, filterObject, parseObject, printTable, 
} = require('./utils');

module.exports.ListVariablesCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listVariables(%s)', profile.name);

        const variables = new Variables(profile.url);
        variables.listVariables(profile.token)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response.result, options);
                    if (options.json) printSuccess(JSON.stringify(result, null, 2), options);
                    else {
                        const tableSpec = [
                            { column: 'Variable Key Name', field: 'keyName', width: 50 },
                        ];
                        printTable(tableSpec, map(x => ({ keyName: x }), result));
                    }
                } else {
                    printError(`Failed to list variables: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list variables : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ReadVariableCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(keyName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.readVariable(%s)', profile.name, keyName);

        const variables = new Variables(profile.url);
        variables.readVariable(profile.token, keyName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                if (options.json) printSuccess(JSON.stringify(result, null, 2), options);
                else {
                    const tableSpec = [
                        { column: 'Variable Key Name', field: 'keyName', width: 50 },
                        { column: 'Value', field: 'value', width: 50 },
                    ];
                    printTable(tableSpec, [{ keyName, value: JSON.stringify(getOr(undefined, 'value', result), null, 2) }]);
                }
            } else {
                printError(`Failed to read secure variable : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to read secure variable : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.WriteVariableCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(keyName, value, options) {
        const profile = loadProfile(options.profile);
        debug('%s.writeVariable(%s)', profile.name, keyName);

        let data = value;
        if (options.data) {
            data = parseObject(options.data, options);
        } else if (options.dataFile) {
            const dataStr = fs.readFileSync(options.dataFile);
            data = parseObject(dataStr, options);
        }

        if (isUndefined(data)) {
          return printError('Failed to write secure variable : no value specified', options);
        }

        const variables = new Variables(profile.url);
        return variables.writeVariable(profile.token, keyName, data).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(result.message, options);
            }
            printError(`Failed to write secure variable : ${response.message}`, options);
        })
        .catch((err) => {
            printError(`Failed to write secure variable : ${err.status} ${err.message}`, options);
        });
    }
};
