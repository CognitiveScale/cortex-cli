import fs from 'node:fs';
import uniqBy from 'lodash/uniqBy.js';
import sortBy from 'lodash/sortBy.js';
import flatten from 'lodash/flatten.js';
import compact from 'lodash/compact.js';
import startsWith from 'lodash/startsWith.js';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Assessments from '../client/assessments.js';
import {
 printSuccess, printError, parseObject, handleTable, printExtendedLogs, handleListFailure, getFilteredOutput, 
} from './utils.js';

const _ = {
    uniqBy,
    sortBy,
    flatten,
    compact,
    startsWith,
};
const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export const ListResourcesCommand = class {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(command) {
        const options = command;
        const profile = await loadProfile(options.profile);
        debug('%s.ListResourcesCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.queryResources(profile.token, options.name, options.scope, options.type, options.skip, options.limit, options.filter, options.sort)
            // eslint-disable-next-line consistent-return
            .then((response) => {
            if (response.success === false) return handleListFailure(response, options, 'Cortex resources');
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(response, options);
            } else {
                printExtendedLogs(response.data, options);
                const tableSpec = [
                    { column: 'Name', field: 'resourceName' },
                    { column: 'Title', field: 'resourceTitle' },
                    { column: 'Resource Type', field: 'resourceType' },
                    { column: 'Project', field: '_projectId' },
                ];
                handleTable(tableSpec, response.data, null, 'No matching resources found');
            }
        })
            .catch((err) => {
            printError(`Failed to list Cortex resources: ${err.status} ${err.message}`, options);
        });
    }
};
export const ListResourceTypesCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(command) {
        const options = command;
        const profile = await loadProfile(options.profile);
        debug('%s.ListResourceTypesCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.listResourceTypes(profile.token)
            .then((response) => {
            if (response.success === false) throw response;
            const data = _.compact(response.data);
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(data, options);
            } else {
                const types = data.map((t) => ({ type: t }));
                const tableSpec = [
                    { column: 'Resource Type', field: 'type' },
                ];
                handleTable(tableSpec, types, null, 'Resource Types not available');
            }
        })
            .catch((err) => {
            printError(`Failed to list Cortex resource types: ${err.status} ${err.message}`, options);
        });
    }
};
export const DependencyTreeCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(dependencyFile, command) {
        const options = command;
        const profile = await loadProfile(options.profile);
        debug('%s.DependencyTreeCommand()', profile.name);
        const client = new Assessments(profile.url);
        let body;
        if (dependencyFile) {
            body = JSON.parse(fs.readFileSync(dependencyFile).toString());
        }
        client.getDependenciesOfResource(profile.token, options.scope, options.type, options.name, body, options.missing)
            .then((response) => {
            if (response.success === false) throw response;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(response, options);
            } else {
                const tableSpec = [
                    { column: 'Name', field: 'name' },
                    { column: 'Title', field: 'title' },
                    { column: 'Resource Type', field: 'type' },
                ];
                handleTable(tableSpec, response.data, null, 'No downstream dependency found');
            }
        })
            .catch((err) => {
            printError(`Failed to list dependency Cortex resource: ${err.status} ${err.message}`, options);
        });
    }
};
export const CreateAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(assessmentDef, command) {
        const options = command;
        const profile = await loadProfile(options.profile);
        debug('%s.CreateAssessmentCommand()', profile.name);
        const client = new Assessments(profile.url);
        let assessment = {};
        if (assessmentDef) {
            try {
                const assessmentDefStr = fs.readFileSync(assessmentDef);
                assessment = parseObject(assessmentDefStr, options);
            } catch (err) {
                printError(`Failed to read assessment definition "${assessmentDef}": ${err.message}`, options);
            }
        }
        client.createAssessment(profile.token, options.name || assessment.name, options.title || assessment.title, options.description || assessment.description, options.scope || assessment.scope, options.component || assessment.component, options.type || assessment.type, options.overwrite || assessment.overwrite)
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
export const ListAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.ListAssessmentCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.listAssessment(profile.token, options.skip, options.limit, options.filter, options.sort)
            // eslint-disable-next-line consistent-return
            .then((response) => {
            if (response.success === false) return handleListFailure(response, options, 'Assessments');
            const result = response.data;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                printExtendedLogs(result, options);
                const tableSpec = [
                    { column: 'Name', field: 'name' },
                    { column: 'Title', field: 'title' },
                    { column: 'Description', field: 'description' },
                    { column: 'Projects', field: 'scope' },
                    { column: '# Reports', field: 'reportCount' },
                    { column: 'Modified', field: '_updatedAt' },
                    { column: 'Author', field: '_createdBy' },
                ];
                handleTable(tableSpec, result, (o) => ({ ...o, _updatedAt: o._updatedAt ? dayjs(o._updatedAt).fromNow() : '-' }), 'No Assessments found');
            }
        })
            .catch((err) => {
            printError(`Failed to list assessment: ${err.status} ${err.message}`, options);
        });
    }
};
export const DescribeAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.DescribeAssessmentCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.getAssessment(profile.token, name)
            .then((response) => {
            if (response.success === false) throw response;
            printSuccess(JSON.stringify(response, null, 2), options);
        })
            .catch((err) => {
            printError(`Failed to get assessment "${name}": ${err.status} ${err.message}`, options);
        });
    }
};
export const DeleteAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.DeleteAssessmentCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.deleteAssessment(profile.token, name)
            .then((response) => {
            if (response.success === false) throw response;
            printSuccess(JSON.stringify(response, null, 2), options);
        })
            .catch((err) => {
            printError(`Failed to delete assessment "${name}": ${err.status} ${err.message}`, options);
        });
    }
};
export const RunAssessmentCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.RunAssessmentCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.runAssessment(profile.token, name)
            .then((response) => {
            if (response.success === false) throw response;
            printSuccess(JSON.stringify(response, null, 2), options);
        })
            .catch((err) => {
            printError(`Failed to run assessment "${name}": ${err.status} ${err.message}`, options);
        });
    }
};
export const ListAssessmentReportCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.ListAssessmentReportCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.listAssessmentReports(profile.token, name)
            .then((response) => {
            if (response.success === false) throw response;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(response, options);
            } else {
                const tableSpec = [
                    { column: 'Assessment Name', field: 'assessmentId' },
                    { column: 'Report Id', field: 'reportId' },
                    { column: 'Impact Summary', field: 'summary' },
                    { column: 'Modified', field: '_updatedAt' },
                    { column: 'Author', field: '_createdBy' },
                ];
                response.data.forEach((r) => r.summary = JSON.stringify(Object.fromEntries(r.summary.map((item) => [item.type, item.count]))));
                handleTable(tableSpec, response.data, (o) => ({ ...o, _updatedAt: o._updatedAt ? dayjs(o._updatedAt).fromNow() : '-' }), `No report found for the Assessment ${name}`);
            }
        })
            .catch((err) => {
            printError(`Failed to list assessment "${name}" reports: ${err.status} ${err.message}`, options);
        });
    }
};
export const GetAssessmentReportCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(name, reportId, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.GetAssessmentReportCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.getAssessmentReport(profile.token, name, reportId)
            .then((response) => {
            if (response.success === false) throw response;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                const output = {
                    name: response.reportId,
                    assessment: response.assessmentId,
                    summary: Object.fromEntries(response.summary.map((item) => [item.type, item.count])),
                    report: response.detail,
                    _createdAt: response._createdAt,
                    _createdBy: response._createdBy,
                };
                getFilteredOutput(output, options);
            } else {
                const flattenRefs = _.uniqBy(_.flatten(response.detail.map((ref) => ref.sourcePath.map((s) => ({ ...s, projectId: ref._projectId })))), (r) => `${r.name}-${r.type}-${r.projectId}`);
                const tableSpec = [
                    { column: 'Name', field: 'name' },
                    { column: 'Title', field: 'title' },
                    { column: 'Resource Type', field: 'type' },
                    { column: 'Project', field: 'projectId' },
                ];
                handleTable(tableSpec, _.sortBy(flattenRefs, ['projectId', 'type']), null, 'No upstream dependencies found');
            }
        })
            .catch((err) => {
            printError(`Failed to get assessment "${name}" report "${reportId}": ${err.status} ${err.message}`, options);
        });
    }
};
export const ExportAssessmentReportCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(name, reportId, command) {
        const options = command;
        const profile = await loadProfile(options.profile);
        debug('%s.ExportAssessmentReportCommand()', profile.name);
        const client = new Assessments(profile.url);
        client.exportAssessmentReport(profile.token, name, reportId, options.type);
    }
};
