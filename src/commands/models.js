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
const _ = require('lodash');
const debug = require('debug')('cortex:cli');
const moment = require('moment');
const { loadProfile } = require('../config');
const Models = require('../client/models');
const Experiments = require('../client/experiments');
const { LISTTABLEFORMAT } = require('./utils');

const {
    printSuccess, printError, filterObject, parseObject, printTable, formatValidationPath,
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

module.exports.ListModelsCommand = class ListModelsCommand {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListModels()', profile.name);
        const models = new Models(profile.url);
        models.listModels(options.project || profile.project, options.offset, options.limit, profile.token).then((response) => {
            if (response.success) {
                let result = response.models;
                if (options.query) result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printTable(LISTTABLEFORMAT, result, o => ({ ...o, updatedAt: o.updatedAt ? moment(o.updatedAt).fromNow() : '-' }));
                }
            } else {
                printError(`Failed to list models: ${response.status} ${response.message}`, options);
            }
        })
            .catch((err) => {
                debug(err);
                printError(`Failed to list models: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeModelCommand = class DescribeModelCommand {
    constructor(program) {
        this.program = program;
    }

    execute(modelName, options) {
        const profile = loadProfile(options.profile);
        const models = new Models(profile.url);
        debug('%s.executeDescribeModel(%s)', profile.name, modelName);
        models.describeModel(options.project || profile.project, profile.token, modelName, options.verbose).then((response) => {
            if (response.success) {
                const result = filterObject(response.model, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to describe model ${modelName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe model ${modelName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DeleteModelCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(modelName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDeleteModel(%s)', profile.name, modelName);
        const models = new Models(profile.url);
        models.deleteModel(options.project || profile.project, profile.token, modelName)
            .then((response) => {
                if (response && response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Model deletion failed: ${response.status} ${response.message}.`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to delete model: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.PublishModelCommand = class PublishModelCommand {
    constructor(program) {
        this.program = program;
    }

    execute(modelName, options) {
        const profile = loadProfile(options.profile);
        const models = new Models(profile.url);
        debug('%s.executePublishModel(%s)', profile.name, modelName);
        models.describeModel(options.project || profile.project, profile.token, modelName, options.verbose).then((response) => {
            if (response.success) {
                const result = filterObject(response.model, options);
                printSuccess(JSON.stringify(result, null, 2), options);
                result.status = 'Published';
                models.saveModel(options.project || profile.project, profile.token, result).then((responseModel) => {
                    if (responseModel.success) {
                        printSuccess('Model saved', options);
                    } else if (responseModel.details) {
                        console.log(`Failed to save model: ${responseModel.status} ${responseModel.message}`);
                        console.log('The following issues were found:');
                        const tableSpec = [
                            { column: 'Path', field: 'path', width: 50 },
                            { column: 'Message', field: 'message', width: 100 },
                        ];
                        response.details.map(d => d.path = formatValidationPath(d.path));
                        printTable(tableSpec, responseModel.details);
                        printError(''); // Just exit
                    } else {
                        printError(JSON.stringify(responseModel));
                    }
                })
                .catch((err) => {
                    printError(`Failed to save model: ${err.status} ${err.message}`, options);
                });
            } else {
                printError(`Failed to publish model ${modelName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe model ${modelName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.RegisterModelCommand = class RegisterModelCommand {
    constructor(program) {
        this.program = program;
    }

    execute(modelDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeRegisterModel(%s)', profile.name, modelDefinition);

        const modelDefStr = fs.readFileSync(modelDefinition);
        const model = parseObject(modelDefStr, options);
        debug('%o', model);

        const experiments = new Experiments(profile.url);
        experiments.saveExperiment(options.project || profile.project, profile.token, model).then((response) => {
            if (response.success) {
                const experimentName = response.result.name;
                experiments.createRun(options.project || profile.project, profile.token, experimentName).then((responseRun) => {
                    if (responseRun.success) {
                        const runId = _.get(responseRun, 'result.runId', '');
                        const contentType = _.get(options, 'contentType', 'application/octet-stream');
                        experiments.uploadArtifact(options.project || profile.project, profile.token, experimentName, runId, model.filePath, model.artifact, contentType).then((responseArtifact) => {
                            if (responseArtifact.success) {
                                printSuccess('Artifact successfully uploaded.', options);
                                printSuccess(JSON.stringify(responseRun.result, null, 2), options);
                            } else {
                                printError(`Failed to upload Artifact: ${responseArtifact.status} ${responseArtifact.message}`, options);
                            }
                        })
                        .catch((err) => {
                            debug(err);
                            printError(`Failed to upload Artifact: ${err.status} ${err.message}`, options);
                        });
                    } else if (responseRun.details) {
                        console.log(`Failed to create run: ${responseRun.status} ${responseRun.message}`);
                        console.log('The following issues were found:');
                        const tableSpec = [
                            { column: 'Path', field: 'path', width: 50 },
                            { column: 'Message', field: 'message', width: 100 },
                        ];
                        response.details.map(d => d.path = formatValidationPath(d.path));
                        printTable(tableSpec, responseRun.details);
                        printError(''); // Just exit
                    } else {
                        printError(JSON.stringify(responseRun));
                    }
                }).catch((err) => {
                    printError(`Failed to create Run: ${err.status} ${err.message}`, options);
                });
            } else if (response.details) {
                console.log(`Failed to save experiment: ${response.status} ${response.message}`);
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
            printError(`Failed to register model: ${err.status} ${err.message}`, options);
        });
}
};
