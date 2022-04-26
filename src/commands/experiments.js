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
const Experiments = require('../client/experiments');
const {
 printSuccess, printError, filterObject, printTable, parseObject, fileExists, formatValidationPath, DEPENDENCYTABLEFORMAT, handleTable,
    validateOptions,
    OPTIONSTABLEFORMAT,
    printExtendedLogs,
} = require('./utils');

class ListExperiments {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listExperiments()', profile.name);

        const exp = new Experiments(profile.url);
        const { validOptions, errorDetails } = validateOptions(options, 'EXPERIMENT');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Experiment list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }
        exp.listExperiments(options.project || profile.project, options.model, profile.token, options.filter, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                let { result } = response;
                printExtendedLogs('LIMIT', result.experiments, options);
                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 40 },
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Version', field: '_version', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                    ];

                    handleTable(tableSpec, result.experiments, null, 'No experiments found');
                }
            } else {
                printError(`Failed to list experiments: ${response.status} - ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list experiments: ${err.status} - ${err.message}`, options);
        });
    }
}

class DescribeExperimentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(experimentName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeExperiment(%s)', profile.name, experimentName);

        const exp = new Experiments(profile.url);
        exp.describeExperiment(options.project || profile.project, profile.token, experimentName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to describe experiment ${experimentName}: ${response.status} - ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe experiment ${experimentName}: ${err.status} - ${err.message}`, options);
        });
    }
}

class DeleteExperimentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(experimentName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteExperiment(%s)', profile.name, experimentName);

        const exp = new Experiments(profile.url);
        exp.deleteExperiment(options.project || profile.project, profile.token, experimentName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            if (response.status === 403) { // has dependencies
                const tableFormat = DEPENDENCYTABLEFORMAT;
                printError(`Experiment deletion failed: ${response.message}.`, options, false);
                return printTable(tableFormat, response.details);
            }
            return printError(`Failed to delete experiment ${experimentName}: ${response.status} - ${response.message}`, options);
        })
        .catch((err) => {
            printError(`Failed to delete experiment ${experimentName}: ${err.status} - ${err.message}`, options);
        });
    }
}

class ListRuns {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(experimentName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listRuns()', profile.name);

        const exp = new Experiments(profile.url);
        const sort = options.sort || JSON.stringify({ startTime: -1 });
        const { validOptions, errorDetails } = validateOptions(options, 'RUN');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Experiment-runs list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }
        exp.listRuns(options.project || profile.project, profile.token, experimentName, options.filter, options.limit, sort, options.skip).then((response) => {
            if (response.success) {
                let { result } = response;

                printExtendedLogs('LIMIT', result.runs, options);
                if (options.json) {
                    if (options.query) result = filterObject(result.runs, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Run ID', field: 'runId', width: 25 },
                        { column: 'Start', field: 'startTime', width: 25 },
                        { column: 'Took', field: 'took', width: 25 },
                        { column: 'Params', field: 'params', width: 45 },
                        { column: 'Metrics', field: 'metrics', width: 45 },
                        { column: 'Artifacts', field: 'artifacts' },
                    ];
                    const trans = (o) => {
                        o.startTime = o.startTime ? moment.unix(o.startTime).format('YYYY-MM-DD HH:mm a') : '';
                        o.took = o.took ? moment.duration(o.took, 'seconds').humanize() : '';
                        o.params = _.map(o.params, (v, k) => `${k}: ${v}`).join('\n');
                        o.metrics = _.map(o.metrics, (v, k) => `${k}: ${v}`).join('\n');
                        o.artifacts = Object.keys(_.get(o, 'artifacts', {})).join(', ');
                        return o;
                    };
                    handleTable(tableSpec, _.get(result, 'runs', []), trans, 'No runs found');
                }
            } else {
                printError(`Failed to list runs: ${response.status} ${response.status} - ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list runs: ${err.status} - ${err.message}`, options);
        });
    }
}

class DescribeRunCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(experimentName, runId, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeRun(%s)', profile.name, runId);

        const exp = new Experiments(profile.url);
        exp.describeRun(options.project || profile.project, profile.token, experimentName, runId).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to describe run ${experimentName}/${runId}: ${response.status} - ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe run ${experimentName}/${runId}: ${err.status} - ${err.message}`, options);
        });
    }
}

class DeleteRunCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(experimentName, runId, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteRun(%s)', profile.name, runId);

        const exp = new Experiments(profile.url);
        exp.deleteRun(options.project || profile.project, profile.token, experimentName, runId).then((response) => {
            if (response.success) {
                return printSuccess(`Run ${runId} in experiment ${experimentName} deleted`, options);
            }
            if (response.status === 403) { // has dependencies
               const tableFormat = DEPENDENCYTABLEFORMAT;
               printError(`Run deletion failed: ${response.message}.`, options, false);
               return printTable(tableFormat, response.details);
            }
            return printError(`Failed to delete run ${experimentName}/${runId}: ${response.status} - ${response.message}`, options);
        })
        .catch((err) => {
            printError(`Failed to delete run ${experimentName}/${runId}: ${err.status} - ${err.message}`, options);
        });
    }
}

class DownloadArtifactCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(experimentName, runId, artifactName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.downloadArtifact(%s)', profile.name, artifactName);

        const exp = new Experiments(profile.url);
        const showProgress = !!options.progress;
        // To download content from Secrets
        exp.downloadArtifact(options.project || profile.project, profile.token, experimentName, runId, artifactName, showProgress).catch((err) => {
            debug(err);
            printError(`Failed to download artifact: ${err.status ? err.status : ''}- ${err.message ? err.message : ''}`, options);
        });
    }
}

class SaveExperimentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(experimentDefinition, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeSaveExperiment(%s)', profile.name, experimentDefinition);

         if (!fileExists(experimentDefinition)) {
            printError(`File does not exist at: ${experimentDefinition}`);
        }
        const experimentDefStr = fs.readFileSync(experimentDefinition);
        const experiment = parseObject(experimentDefStr, options);
        debug('%o', experiment);

        const experiments = new Experiments(profile.url);
        experiments.saveExperiment(options.project || profile.project, profile.token, experiment).then((response) => {
            if (response.success) {
                printSuccess('Experiment saved', options);
            } else if (response.details) {
                console.log(`Failed to save experiment: ${response.status} ${response.message}`);
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
                printError(`Failed to save experiment: ${err.status} ${err.message}`, options);
            });
    }
}

class CreateRunCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(runDefinition, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeCreateRun(%s)', profile.name, runDefinition);
         if (!fs.existsSync(runDefinition)) {
            printError(`File does not exist at: ${runDefinition}`);
        }
        const runDefinitionStr = fs.readFileSync(runDefinition);
        const run = parseObject(runDefinitionStr, options);

        const experiments = new Experiments(profile.url);
        experiments.createRun(options.project || profile.project, profile.token, run).then((response) => {
            if (response.success) {
                printSuccess('Run created', options);
                printSuccess(JSON.stringify(response.result, null, 2), options);
            } else if (response.details) {
                console.log(`Failed to create run: ${response.status} ${response.message}`);
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
                printError(`Failed to create run: ${err.status} ${err.message}`, options);
            });
    }
}

class UploadArtifactCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(experimentName, runId, filePath, artifact, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeUploadArtifact()', profile.name);

        const experiments = new Experiments(profile.url);

        const upload = _.partial(UploadArtifactCommand.upload, experiments, profile, options);

        upload(filePath, artifact, experimentName, runId);
    }

    static upload(experiments, profile, options, filePath, artifact, experimentName, runId) {
        const contentType = _.get(options, 'contentType', 'application/octet-stream');
        return experiments.uploadArtifact(options.project || profile.project, profile.token, experimentName, runId, filePath, artifact, contentType).then((response) => {
            if (response.success) {
                printSuccess('Artifact successfully uploaded.', options);
                printSuccess(JSON.stringify(response, null, 2), options);
            } else {
                printError(`Failed to upload Artifact: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to upload Artifact: ${err.status} ${err.message}`, options);
        });
    }
}

module.exports = {
    ListExperiments,
    ListRuns,
    DescribeExperimentCommand,
    DescribeRunCommand,
    DeleteRunCommand,
    DeleteExperimentCommand,
    DownloadArtifactCommand,
    SaveExperimentCommand,
    CreateRunCommand,
    UploadArtifactCommand,
};
