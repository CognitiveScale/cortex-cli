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
const { loadProfile } = require('../config');
const Models = require('../client/models');

const {
    printSuccess, printError, filterObject, parseObject, printTable, formatValidationPath
} = require('./utils');

module.exports.SaveModelCommand = class SaveModelCommand {
    constructor(program) {
        this.program = program;
    }

    execute(modelDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeSaveModel(%s)', profile.name, modelDefinition);

        const modelDefStr = fs.readFileSync(modelDefinition);
        const model = parseObject(modelDefStr, options);
        debug('%o', model);

        const models = new Models(profile.url);
        models.saveModel(options.project || profile.project, profile.token, model).then((response) => {
            if (response.success) {
                printSuccess('Model saved', options);
            } else if (response.details) {
                console.log(`Failed to save model: ${response.status} ${response.message}`);
                console.log('The following issues were found:');
                const tableSpec = [
                    { column: 'Path', field: 'path', width: 50 },
                    { column: 'Message', field: 'message', width: 100 },
                ];
                response.details.map(d => d.path = formatValidationPath(d.path));
                printTable(tableSpec, response.details);
                printError(''); // Just exit
            } else {
                printError(JSON.stringify(response));
            }
        })
            .catch((err) => {
                printError(`Failed to save model: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeleteModelCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(actionName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDeleteAction(%s)', profile.name, actionName);
        const models = new Models(profile.url);
        models.deleteModel(options.project || profile.project, profile.token, actionName)
            .then((response) => {
                if (response && response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Model deletion failed: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to delete model: ${err.status} ${err.message}`, options);
            });
    }
};
