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
const Secrets = require('../client/secrets');
const {
 printSuccess, printError, filterObject, parseObject, printTable, DEPENDENCYTABLEFORMAT,
} = require('./utils');

module.exports.ListSecretsCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listsecrets(%s)', profile.name);

        const secrets = new Secrets(profile.url);
        secrets.listSecrets(options.project || profile.project, profile.token)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response.result, options);
                    if (options.json) printSuccess(JSON.stringify(result, null, 2), options);
                    else {
                        const tableSpec = [
                            { column: 'Secret Key Name', field: 'keyName', width: 50 },
                        ];
                        printTable(tableSpec, map((x) => ({ keyName: x }), result));
                    }
                } else {
                    printError(`Failed to list secrets: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list secrets : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ReadSecretsCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(keyName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.readsecret(%s)', profile.name, keyName);

        const secrets = new Secrets(profile.url);
        secrets.readSecret(options.project || profile.project, profile.token, keyName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                if (options.json) printSuccess(JSON.stringify(result, null, 2), options);
                else {
                    const tableSpec = [
                        { column: 'Key Name', field: 'keyName', width: 50 },
                        { column: 'Value (Not Shown)', field: 'value', width: 50 },
                    ];
                    printTable(tableSpec, [{ keyName, value: JSON.stringify(getOr(undefined, 'value', result), null, 2) }]);
                }
            } else {
                printError(`Failed to read secure secret : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to read secure secret : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.WriteSecretsCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(keyName, value, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.writeSecret(%s)', profile.name, keyName);

        let data = value;
        if (options.data) {
            try {
                data = parseObject(options.data, options);
            } catch (e) {
                printError(`Failed to parse data: ${options.data} Error: ${e}`, options);
            }
        } else if (options.dataFile) {
            const dataStr = fs.readFileSync(options.dataFile);
            data = parseObject(dataStr, options);
        }

        if (isUndefined(data)) {
          return printError('Failed to write secret : no value specified', options);
        }

        // FAB-1775: validate secret key name
        const invalidCharsRegex = /^\w+([./-]?\w+)*$/;
        if (!invalidCharsRegex.test(keyName)) {
            return printError(`Failed to write secret : keyName did not conform to regex ${JSON.stringify(invalidCharsRegex)}`, options);
        }

        const secrets = new Secrets(profile.url);
        return secrets.writeSecret(options.project || profile.project, profile.token, keyName, data).then((response) => {
            if (response.success) {
                return printSuccess(response.message, options);
            }
            return printError(`Failed to write secret: ${response.status} ${response.message}`, options);
        })
        .catch((err) => {
            printError(`Failed to write secret : ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DeleteSecretCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(keyName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteSecret(%s)', profile.name, keyName);

        const secrets = new Secrets(profile.url);
        secrets.deleteSecret(options.project || profile.project, profile.token, keyName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            if (response.status === 403) { // has dependencies
                const tableFormat = DEPENDENCYTABLEFORMAT;
                printError(`Secret deletion failed: ${response.message}.`, options, false);
                return printTable(tableFormat, response.details);
            }
            return printError(`Failed to delete secure secret : ${response.message}`, options);
        })
        .catch((err) => {
            printError(`Failed to delete secure secret : ${err.status} ${err.message}`, options);
        });
    }
};
