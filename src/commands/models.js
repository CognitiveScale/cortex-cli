import fs from 'node:fs';
import get from 'lodash/get.js';
import pick from 'lodash/pick.js';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Models from '../client/models.js';
import Experiments from '../client/experiments.js';
import {
    LISTTABLEFORMAT,
    RUNTABLEFORMAT,
    printExtendedLogs,
    handleListFailure,
    handleDeleteFailure,
    printSuccess,
    printError,
    filterObject,
    parseObject,
    fileExists,
    handleTable,
    getFilteredOutput,
    printErrorDetails,
} from './utils.js';

const _ = {
    get,
    pick,
};
const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export class SaveModelCommand {
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
                printErrorDetails(response, options);
                printError(''); // Just exit
            } else {
                printError(JSON.stringify(response));
            }
        })
            .catch((err) => {
            printError(`Failed to save model: ${err.status} ${err.message}`, options);
        });
    }
}
export class ListModelsCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListModels()', profile.name);
        const models = new Models(profile.url);
        // eslint-disable-next-line consistent-return
        models.listModels(options.project || profile.project, options.skip, options.limit, options.filter, options.sort, options.tags, profile.token).then((response) => {
            if (response.success) {
                const result = response.models;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    printExtendedLogs(result, options);
                    handleTable(LISTTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No models found');
                }
            } else {
                return handleListFailure(response, options, 'Models');
            }
        })
            .catch((err) => {
            debug(err);
            printError(`Failed to list models: ${err.status} ${err.message}`, options);
        });
    }
}
export class ListModelRunsCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(modelName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListModels()', profile.name);
        const models = new Models(profile.url);
        // eslint-disable-next-line consistent-return
        models.listModelRuns(options.project || profile.project, modelName, profile.token, options.filter, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                const result = response.runs;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    printExtendedLogs(result, options);
                    handleTable(RUNTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No runs found');
                }
            } else {
                return handleListFailure(response, options, 'Model-runs');
            }
        })
            .catch((err) => {
            debug(err);
            printError(`Failed to list model runs: ${err.status} ${err.message}`, options);
        });
    }
}

export class DescribeModelCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(modelName, options) {
        const profile = await loadProfile(options.profile);
        const models = new Models(profile.url);
        debug('%s.executeDescribeModel(%s)', profile.name, modelName);
        models.describeModel(options.project || profile.project, profile.token, modelName, options.verbose).then((response) => {
            if (response.success) {
                getFilteredOutput(response.model, options);
            } else {
                printError(`Failed to describe model ${modelName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
            printError(`Failed to describe model ${modelName}: ${err.status} ${err.message}`, options);
        });
    }
}
export const DeleteModelCommand = class {
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
            return handleDeleteFailure(response, options, 'Model');
        })
            .catch((err) => {
            printError(`Failed to delete model: ${err.status} ${err.message}`, options);
        });
    }
};
export class UpdateModelStatusCommand {
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
}
export class RegisterModelCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(modelDefinition, options) {
        const profile = await loadProfile(options.profile);
        const experiments = new Experiments(profile.url);
        try {
            debug('%s.executeRegisterModel(%s)', profile.name, modelDefinition);
            const modelDefStr = fs.readFileSync(modelDefinition);
            const model = parseObject(modelDefStr, options);
            debug('%o', model);
            const saveExperimentResponse = await experiments.saveExperiment(options.project || profile.project, profile.token, model);
            if (!saveExperimentResponse.success) {
                printErrorDetails(saveExperimentResponse, options);
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
            const uploadArtifactResponse = await experiments.uploadArtifact(options.project || profile.project, profile.token, experimentName, runId, model.filePath, model.artifact, contentType);
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
}
