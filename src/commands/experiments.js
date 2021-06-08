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

const _ = require('lodash');
const debug = require('debug')('cortex:cli');
const moment = require('moment');
const { loadProfile } = require('../config');
const Experiments = require('../client/experiments');
const {
 printSuccess, printError, filterObject, printTable,
} = require('./utils');

class ListExperiments {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listExperiments()', profile.name);

        const exp = new Experiments(profile.url);
        exp.listExperiments(options.project || profile.project, options.modelId, profile.token).then((response) => {
            if (response.success) {
                let { result } = response;
                if (options.query) {
                    result = filterObject(response.result, options);
                }
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 40 },
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Version', field: '_version', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                    ];

                    printTable(tableSpec, result.experiments);
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

    execute(experimentName, options) {
        const profile = loadProfile(options.profile);
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

    execute(experimentName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDeleteExperiment(%s)', profile.name, experimentName);

        const exp = new Experiments(profile.url);
        exp.deleteExperiment(options.project || profile.project, profile.token, experimentName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to delete experiment ${experimentName}: ${response.status} - ${response.message}`, options);
            }
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

    execute(experimentName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.listRuns()', profile.name);

        const exp = new Experiments(profile.url);
        const sort = options.sort || JSON.stringify({ startTime: -1 });

        exp.listRuns(options.project || profile.project, profile.token, experimentName, options.filter, options.limit, sort).then((response) => {
            if (response.success) {
                let { result } = response;
                if (options.query) {
                    result = filterObject(response.result, options);
                }
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { alias: 'Run ID', value: 'runId', width: 25 },
                        {
 alias: 'Start', value: 'startTime', width: 25, formatter: val => moment.unix(val).format('YYYY-MM-DD HH:mm a'), 
},
                        {
 alias: 'Took', value: 'took', width: 25, formatter: val => moment.duration(val, 'seconds').humanize(), 
},
                        {
 alias: 'Params', value: 'params', width: 45, formatter: val => _.map(val, (v, k) => `${k}: ${v}`).join('\n'), 
},
                        {
 alias: 'Metrics', value: 'metrics', width: 45, formatter: val => _.map(val, (v, k) => `${k}: ${v}`).join('\n'), 
},
                        { alias: 'Artifacts', value: 'artifacts', formatter: val => Object.keys(val).join(', ') },
                    ];
                    
                    const Table = require('tty-table');
                    const t = new Table(tableSpec, result.runs);
                    console.log(t.render());
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

    execute(experimentName, runId, options) {
        const profile = loadProfile(options.profile);
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

    execute(experimentName, runId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDeleteRun(%s)', profile.name, runId);

        const exp = new Experiments(profile.url);
        exp.deleteRun(options.project || profile.project, profile.token, experimentName, runId).then((response) => {
            if (response.success) {
                printSuccess(`Run ${runId} in experiment ${experimentName} deleted`, options);
            } else {
                printError(`Failed to delete run ${experimentName}/${runId}: ${response.status} - ${response.message}`, options);
            }
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

    execute(experimentName, runId, artifactName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.downloadArtifact(%s)', profile.name, artifactName);

        const exp = new Experiments(profile.url);
        const showProgress = !!options.progress;

        // To download content from Secrets
        exp.downloadArtifact(options.project || profile.project, profile.token, experimentName, runId, artifactName, showProgress).then((response) => {
            if (response.success) {
                // messages need to be on stderr as content is streamed to stdout
                console.error(response.message);
            } else {
                printError(`Failed to download artifact: ${response.status} - ${response.message}`, options);
            }
        }).catch((err) => {
            debug(err);
            printError(`Failed to download artifact: ${err.status} - ${err.message}`, options);
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
};
