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
    printSuccess,
    printError,
    filterObject,
    parseObject,
    fileExists,
    handleTable,
    getFilteredOutput,
    handleError,
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
        try {
            const response = await models.saveModel(options.project || profile.project, profile.token, model);
            printSuccess('Model saved', options);
            printSuccess(JSON.stringify(_.pick(response, ['version', 'created', 'modelId']), null, 2));
        } catch (err) {
            handleError(err, options, 'Failed to save model');
        }
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
        try {
            const response = await models.listModels(options.project || profile.project, options.skip, options.limit, options.filter, options.sort, options.tags, profile.token);
            const result = response.models;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                printExtendedLogs(result, options);
                handleTable(LISTTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No models found');
            }
        } catch (err) {
            handleError(err, options, 'Failed to list models');
        }
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
        try {
        // eslint-disable-next-line consistent-return
            const response = await models.listModelRuns(options.project || profile.project, modelName, profile.token, options.filter, options.limit, options.skip, options.sort);
            const result = response.runs;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                printExtendedLogs(result, options);
                handleTable(RUNTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No runs found');
            }
        } catch (err) {
            handleError(err, options, 'Failed to list model runs');
        }
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
        try {
        const response = await models.describeModel(options.project || profile.project, profile.token, modelName, options.verbose);
        getFilteredOutput(response.model, options);
        } catch (err) {
            handleError(err, options, `Failed to describe model ${modelName}`);
        }
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
        try {
            const response = await models.deleteModel(options.project || profile.project, profile.token, modelName);
            const result = filterObject(response, options);
            return printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            return handleError(err, { ...options, tableformat: 'DEPENDENCYTABLEFORMAT' }, `Failed to delete model "${modelName}"`);
        }
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
            await models.updateModelStatus(options.project || profile.project, profile.token, modelName, status);
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
            const experimentName = _.get(saveExperimentResponse, 'result.name', '');
            const saveRunResponse = await experiments.createRun(options.project || profile.project, profile.token, experimentName);
            const runId = _.get(saveRunResponse, 'result.runId', '');
            const contentType = _.get(options, 'contentType', 'application/octet-stream');
            await experiments.uploadArtifact(options.project || profile.project, profile.token, experimentName, runId, model.filePath, model.artifact, contentType);
            printSuccess('Artifact successfully uploaded.', options);
            printSuccess(JSON.stringify(saveRunResponse.result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to upload model');
        }
    }
}
