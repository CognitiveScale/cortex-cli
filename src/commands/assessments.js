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
const Assessments = require('../client/assessments');

const {
    printSuccess, printError, parseObject, printTable,
} = require('./utils');

module.exports.ListResourcesCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);
        debug('%s.ListResourcesCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.queryResources(profile.token, options.name, options.scope, options.type, options.skip, options.limit)
            .then((response) => {
                if (options.json) {
                    printSuccess(JSON.stringify(response, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'resourceName', width: 30 },
                        { column: 'Title', field: 'resourceTitle', width: 30 },
                        { column: 'Type', field: 'resourceType', width: 16 },
                        { column: 'Project', field: '_projectId', width: 15 },
                    ];
                    printTable(tableSpec, response);
                }
            })
            .catch((err) => {
                printError(`Failed to list actions: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.CreateAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(assessmentDef, command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);
        debug('%s.CreateAssessmentCommand()', profile.name);
        const client = new Assessments(profile.url);
        let assessment = {};
        if (assessmentDef) {
            try {
                const assessmentDefStr = fs.readFileSync(assessmentDef);
                assessment = parseObject(assessmentDefStr, options);
            } catch (err) {
                printError(`Failed to read assessment definition ${assessmentDef}: ${err.message}`, options);
            }
        }
        client.createAssessment(profile.token, options.name || assessment.name, options.title || assessment.title,
            options.description || assessment.description, options.scope || assessment.scope,
            options.component || assessment.component, options.type || assessment.type)
            .then((response) => {
                if (response.success) {
                    printSuccess(`Assessment ${options.name} saved successfully`, options);
                } else {
                    printError(`Failed to save assessment: ${JSON.stringify(response)}`);
                }
            })
            .catch((err) => {
                printError(`Failed to save assessment: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ListAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.ListAssessmentCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.listAssessment(profile.token, options.skip, options.limit)
            .then((response) => {
                if (options.json) {
                    printSuccess(JSON.stringify(response, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 30 },
                        { column: 'Title', field: 'title', width: 30 },
                        { column: 'Description', field: 'description', width: 40 },
                        { column: 'Projects', field: 'scope', width: 25 },
                        { column: '# Reports', field: 'reportCount', width: 12 },
                        { column: 'Created At', field: 'createdAt', width: 25 },
                    ];
                    printTable(tableSpec, response);
                }
            })
            .catch((err) => {
                printError(`Failed to list assessment: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(name, options) {
        const profile = loadProfile(options.profile);
        debug('%s.DescribeAssessmentCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.getAssessment(profile.token, name)
            .then((response) => {
                printSuccess(JSON.stringify(response, null, 2), options);
            })
            .catch((err) => {
                printError(`Failed to get assessment ${name}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeleteAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(name, options) {
        const profile = loadProfile(options.profile);
        debug('%s.DeleteAssessmentCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.deleteAssessment(profile.token, name)
            .then((response) => {
                printSuccess(JSON.stringify(response, null, 2), options);
            })
            .catch((err) => {
                printError(`Failed to delete assessment ${name}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RunAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(name, options) {
        const profile = loadProfile(options.profile);
        debug('%s.RunAssessmentCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.runAssessment(profile.token, name)
            .then((response) => {
                printSuccess(JSON.stringify(response, null, 2), options);
            })
            .catch((err) => {
                printError(`Failed to run assessment ${name}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ListAssessmentReportCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(name, options) {
        const profile = loadProfile(options.profile);
        debug('%s.ListAssessmentReportCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.listAssessmentReports(profile.token, name)
            .then((response) => {
                if (options.json) {
                    printSuccess(JSON.stringify(response, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Assessment Name', field: 'assessmentId', width: 30 },
                        { column: 'Report Id', field: 'reportId', width: 40 },
                        { column: 'Impact Summary', field: 'summary', width: 60 },
                        { column: 'Created At', field: 'createdAt', width: 25 },
                    ];
                    response.forEach(r => r.summary = JSON.stringify(r.summary));
                    printTable(tableSpec, response);
                }
            })
            .catch((err) => {
                printError(`Failed to list assessment ${name} reports: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.GetAssessmentReportCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(name, reportId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.GetAssessmentReportCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.getAssessmentReport(profile.token, name, reportId)
            .then((response) => {
                printSuccess(JSON.stringify(response, null, 2), options);
            })
            .catch((err) => {
                printError(`Failed to get assessment ${name} report ${reportId}: ${err.status} ${err.message}`, options);
            });
    }
};
