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
const Catalog = require('../client/catalog');
const { printSuccess, printError, filterObject, parseObject } = require('./utils');

module.exports.SaveTypeCommand = class SaveTypeCommand {

    constructor(program) {
        this.program = program;
    }

    execute(typeDefinition, options) {
        debug('%s.executeSaveType(%s)', options.profile, typeDefinition);
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);

        const typeDefStr = fs.readFileSync(typeDefinition);
        const type = parseObject(typeDefStr, options);
        debug('%o', type);

        catalog.saveType(profile.token, type).then((response) => {
            if (response.success) {
                printSuccess(`Type definition saved`, options);
            }
            else {
                printError(`Failed to save type: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to save type: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListTypesCommand = class ListTypesCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.executeListTypes()', options.profile);
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        
        catalog.listTypes(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.types, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to list types: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to list types ${typeName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeTypeCommand = class DescribeTypeCommand {

    constructor(program) {
        this.program = program;
    }

    execute(typeName, options) {
        debug('%s.executeDescribeType(%s)', options.profile, typeName);
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);

        catalog.describeType(profile.token, typeName).then((response) => {
            if (response.success) {
                let result = filterObject(response.type, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe type ${typeName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe type ${typeName}: ${err.status} ${err.message}`, options);
        });
    }
}