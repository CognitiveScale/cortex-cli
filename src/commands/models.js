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

const _ = {
    get: require('lodash/get'),
    pick: require('lodash/pick'),
};
const debug = require('debug')('cortex:cli');
const moment = require('moment');
const { loadProfile } = require('../config');
const Models = require('../client/models');
const Experiments = require('../client/experiments');
const { LISTTABLEFORMAT, RUNTABLEFORMAT, DEPENDENCYTABLEFORMAT } = require('./utils');

const {
    printSuccess, printError, filterObject, parseObject, printTable, formatValidationPath, fileExists,
} = require('./utils');

module.exports.SaveModelCommand = class SaveModelCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(modelDefinition, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeSaveModel(%s)', profile.name, modelDefinition);
         if (!fileExists(modelDefinition)) {
            printError(`File does not exist at: ${modelDefinition}`);
        }
        const modelDefStr = fs.readFileSync(modelDefinition);
        const model = parseObject(modelDefStr, options);
        debug('%o', model);

        const models = new Models(profile.url);
        models.saveModel(options.project || profile.project, profile.token, model).then((response) => {
            if (response.success) {
                printSuccess('Model saved', options);
                printSuccess(JSON.stringify(_.pick(response.message, ['version', 'created', 'modelId']), null, 2));
            } else if (response.details) {
                console.log(`Failed to save model: ${response.status} ${response.message}`);
                console.log('The following issues were found:');
                const tableSpec = [
                    { column: 'Path', field: 'path', width: 50 },
                    { column: 'Message', field: 'message', width: 100 },
                ];
                response.details.map((d) => d.path = formatValidationPath(d.path));
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

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListModels()', profile.name);
        const models = new Models(profile.url);
        models.listModels(options.project || profile.project, options.offset, options.limit, options.tags, profile.token).then((response) => {
            if (response.success) {
                let result = response.models;

                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printTable(LISTTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? moment(o.updatedAt).fromNow() : '-' }));
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

module.exports.ListModelRunsCommand = class ListModelsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(modelName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListModels()', profile.name);
        const models = new Models(profile.url);
        models.listModelRuns(options.project || profile.project, modelName, profile.token).then((response) => {
            if (response.success) {
                let result = response.runs;

                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printTable(RUNTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? moment(o.updatedAt).fromNow() : '-' }));
                }
            } else {
                printError(`Failed to list model runs: ${response.status} ${response.message}`, options);
            }
        })
            .catch((err) => {
                debug(err);
                printError(`Failed to list model runs: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeModelCommand = class DescribeModelCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(modelName, options) {
        const profile = await loadProfile(options.profile);
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

    async execute(modelName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteModel(%s)', profile.name, modelName);
        const models = new Models(profile.url);
        models.deleteModel(options.project || profile.project, profile.token, modelName)
            .then((response) => {
                if (response && response.success) {
                    const result = filterObject(response, options);
                    return printSuccess(JSON.stringify(result, null, 2), options);
                }
                if (response.status === 403) { // has dependencies
                    const tableFormat = DEPENDENCYTABLEFORMAT;
                    printError(`Model deletion failed: ${response.message}.`, options, false);
                    return printTable(tableFormat, response.details);
                }
                return printError(`Model deletion failed: ${response.status} ${response.message}.`, options);
            })
            .catch((err) => {
                printError(`Failed to delete model: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.UpdateModelStatusCommand = class UpdateModelStatusCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(modelName, options, status) {
        const profile = await loadProfile(options.profile);
        const models = new Models(profile.url);
        debug('%s.executeUpdateModelStatus(%s)', profile.name, modelName, status);
        try {
            const updateModelStatusObj = await models.updateModelStatus(options.project || profile.project, profile.token, modelName, status);
            if (!updateModelStatusObj.success) {
                printError(JSON.stringify(updateModelStatusObj));
            }
            printSuccess(`Model ${status}ed`, options);
        } catch (err) {
            printError(`Failed to publish model ${modelName}: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.RegisterModelCommand = class RegisterModelCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(modelDefinition, options) {
        const profile = await loadProfile(options.profile);

        function printErrorDetails(response) {
            const tableSpec = [
                { column: 'Path', field: 'path', width: 50 },
                { column: 'Message', field: 'message', width: 100 },
            ];
            response.details.map((d) => d.path = formatValidationPath(d.path));
            printTable(tableSpec, response.details);
            printError(''); // Just exit
        }

        const experiments = new Experiments(profile.url);

        try {
            debug('%s.executeRegisterModel(%s)', profile.name, modelDefinition);

            const modelDefStr = fs.readFileSync(modelDefinition);
            const model = parseObject(modelDefStr, options);
            debug('%o', model);

            const saveExperimentResponse = await experiments.saveExperiment(options.project || profile.project, profile.token, model);
            if (!saveExperimentResponse.success) {
                if (saveExperimentResponse.details) {
                    printErrorDetails(saveExperimentResponse);
                    return;
                }
                printError(JSON.stringify(saveExperimentResponse));
                return;
            }
            const experimentName = _.get(saveExperimentResponse, 'result.name', '');
            const saveRunResponse = await experiments.createRun(options.project || profile.project, profile.token, experimentName);
            if (!saveRunResponse.success) {
                if (saveRunResponse.details) {
                    printErrorDetails(saveRunResponse);
                    return;
                }
                printError(JSON.stringify(saveRunResponse));
                return;
            }
            const runId = _.get(saveRunResponse, 'result.runId', '');
            const contentType = _.get(options, 'contentType', 'application/octet-stream');
            const uploadArtifactResponse = await experiments.uploadArtifact(
                options.project || profile.project, profile.token,
                experimentName, runId, model.filePath, model.artifact, contentType,
            );
            if (uploadArtifactResponse.success) {
                printSuccess('Artifact successfully uploaded.', options);
                printSuccess(JSON.stringify(saveRunResponse.result, null, 2), options);
                return;
            }
            printError(`Failed to upload Artifact: ${uploadArtifactResponse.status} ${uploadArtifactResponse.message}`, options);
        } catch (err) {
            printError(`Failed to upload model: ${err.status} ${err.message}`, options);
        }
    }
};
