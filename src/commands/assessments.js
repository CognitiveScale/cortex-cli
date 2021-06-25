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
    uniqBy: require('lodash/uniqBy'),
    sortBy: require('lodash/sortBy'),
    flatten: require('lodash/flatten'),
    compact: require('lodash/compact'),
};
const debug = require('debug')('cortex:cli');
const moment = require('moment');
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
                if (response.success === false) throw response;
                if (options.json) {
                    printSuccess(JSON.stringify(response, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'resourceName' },
                        { column: 'Title', field: 'resourceTitle' },
                        { column: 'Resource Type', field: 'resourceType' },
                        { column: 'Project', field: '_projectId' },
                    ];
                    printTable(tableSpec, response.data);
                }
            })
            .catch((err) => {
                printError(`Failed to list Cortex resources: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ListResourceTypesCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);
        debug('%s.ListResourceTypesCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.listResourceTypes(profile.token)
            .then((response) => {
                if (response.success === false) throw response;
                const data = _.compact(response.data);
                if (options.json) {
                    printSuccess(JSON.stringify(data, null, 2), options);
                } else {
                    const types = data.map(t => ({ type: t }));
                    const tableSpec = [
                        { column: 'Resource Type', field: 'type' },
                    ];
                    printTable(tableSpec, types);
                }
            })
            .catch((err) => {
                printError(`Failed to list Cortex resource types: ${err.status} ${err.message}`, options);
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
                if (response.success === false) throw response;
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
                if (response.success === false) throw response;
                if (options.json) {
                    printSuccess(JSON.stringify(response, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name' },
                        { column: 'Title', field: 'title' },
                        { column: 'Description', field: 'description' },
                        { column: 'Projects', field: 'scope' },
                        { column: '# Reports', field: 'reportCount' },
                        { column: 'Modified', field: '_updatedAt' },
                        { column: 'Author', field: '_createdBy' },
                    ];
                    printTable(tableSpec, response.data, o => ({ ...o, _updatedAt: o._updatedAt ? moment(o._updatedAt).fromNow() : '-' }));
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
                if (response.success === false) throw response;
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
                if (response.success === false) throw response;
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
                if (response.success === false) throw response;
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
                if (response.success === false) throw response;
                if (options.json) {
                    printSuccess(JSON.stringify(response, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Assessment Name', field: 'assessmentId' },
                        { column: 'Report Id', field: 'reportId' },
                        { column: 'Impact Summary', field: 'summary' },
                        { column: 'Modified', field: '_updatedAt' },
                        { column: 'Author', field: '_createdBy' },
                    ];
                    response.data.forEach(r => r.summary = JSON.stringify(Object.fromEntries(r.summary.map(item => [item.type, item.count]))));
                    printTable(tableSpec, response.data, o => ({ ...o, _updatedAt: o._updatedAt ? moment(o._updatedAt).fromNow() : '-' }));
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
                if (response.success === false) throw response;
                if (options.json) {
                    const output = {
                        name: response.reportId,
                        assessment: response.assessmentId,
                        summary: Object.fromEntries(response.summary.map(item => [item.type, item.count])),
                        report: response.detail,
                        _createdAt: response._createdAt,
                        _createdBy: response._createdBy,
                    };
                    printSuccess(JSON.stringify(output, null, 2), options);
                } else {
                    const flattenRefs = _.uniqBy(
                        _.flatten(
                            response.detail.map(ref => ref.sourcePath.map(s => ({ ...s, projectId: ref._projectId }))),
                        ), r => `${r.name}-${r.type}-${r.projectId}`,
                    );
                    const tableSpec = [
                        { column: 'Name', field: 'name' },
                        { column: 'Title', field: 'title' },
                        { column: 'Resource Type', field: 'type' },
                        { column: 'Project', field: 'projectId' },
                    ];
                    printTable(tableSpec, _.sortBy(flattenRefs, ['projectId', 'type']));
                }
            })
            .catch((err) => {
                printError(`Failed to get assessment ${name} report ${reportId}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ExportAssessmentReportCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(name, reportId, command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);
        debug('%s.ExportAssessmentReportCommand()', profile.name);

        const client = new Assessments(profile.url);
        client.exportAssessmentReport(profile.token, name, reportId, options.type)
            .then((response) => {
                if (response.success === false) throw response;
                printSuccess(`Report exported to ${response.file}`, options);
            })
            .catch((err) => {
                printError(`Failed to export assessment ${name} report ${reportId}: ${err.status} ${err.message}`, options);
            });
    }
};
