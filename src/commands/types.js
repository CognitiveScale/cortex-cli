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
const moment = require('moment');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const { LISTTABLEFORMAT, filterObject, validateOptions, OPTIONSTABLEFORMAT} = require('./utils');

const {
 printSuccess, printError, parseObject, printTable,
} = require('./utils');

module.exports.SaveTypeCommand = class SaveTypeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(typeDefinition, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeSaveType(%s)', profile.name, typeDefinition);
        try {
            const typeDefStr = fs.readFileSync(typeDefinition);
            const type = parseObject(typeDefStr, options);
            debug('%o', type);

            let normalizedType = {};
            if (!('types' in type)) normalizedType.types = [type];
            else normalizedType = type;

            const catalog = new Catalog(profile.url);
            const response = await catalog.saveType(options.project || profile.project, profile.token, normalizedType);
            if (response.success) {
                return printSuccess('Type definition saved', options);
            }
            return printError(`${response.message}: ${JSON.stringify(response.details || '')} `);
        } catch (err) {
            return printError(`Failed to save type: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.ListTypesCommand = class ListTypesCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListTypes()', profile.name);

        const catalog = new Catalog(profile.url);
        const { validOptions, errorDetails } = validateOptions(options, 'TYPE');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Type list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }
        catalog.listTypes(options.project || profile.project, profile.token, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                let result = response.types;
                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printTable(LISTTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? moment(o.updatedAt).fromNow() : '-' }));
                }
            } else {
                printError(`Failed to list types: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to list types: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeTypeCommand = class DescribeTypeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(typeName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeType(%s)', profile.name, typeName);

        const catalog = new Catalog(profile.url);
        catalog.describeType(options.project || profile.project, profile.token, typeName).then((response) => {
            if (response.success) {
                const result = filterObject(response.type, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to describe type ${typeName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe type ${typeName}: ${err.status} ${err.message}`, options);
        });
    }
};
