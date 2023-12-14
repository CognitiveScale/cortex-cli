import querystring from 'querystring';
import stream from 'node:stream';
import { createWriteStream } from 'node:fs';
import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { printSuccess, printError, constructError } from '../commands/utils.js';

const { pipeline } = stream;
const debug = debugSetup('cortex:cli');
export default (class Assessments {
    constructor(cortexUrl) {
        this.endpointV4 = `${cortexUrl}/fabric/v4/impactassessment`;
        this.endpointApiV4 = `${cortexUrl}/fabric/v4/dependencies`;
    }

    getDependenciesOfResource(token, project, type, name, json = null, missing = false) {
        const url = `${this.endpointApiV4}/tree/${project}/${type}/${encodeURIComponent(name)}?${querystring.stringify({ missing })}`;
        debug('dependencyTree => %s', url);
        const body = { headers: defaultHeaders(token) };
        if (json) {
            body.json = json;
        }
        return got
            .post(url, body)
            .json();
    }

    queryResources(token, name, projectId, type, skip, limit, filter, sort) {
        const url = `${this.endpointV4}/resources?${querystring.stringify({
            projectId,
            name,
            type,
            skip,
            limit,
            filter,
            sort,
        })}`;
        debug('queryResources => %s', url);
        return got
            .get(url, { headers: defaultHeaders(token) })
            .json();
    }

    listResourceTypes(token) {
        const url = `${this.endpointV4}/types`;
        debug('listResourceTypes => %s', url);
        return got
            .get(url, { headers: defaultHeaders(token) })
            .json();
    }

    createAssessment(token, name, title, description, scope, componentName, componentTypes, overwrite) {
        const url = `${this.endpointV4}/assessments`;
        debug('createAssessment => %s', url);
        return got
            .post(url, {
            headers: defaultHeaders(token, { 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                name,
                title,
                description,
                scope,
                componentName,
                componentTypes,
                overwrite,
            }),
        }).json();
    }

    listAssessment(token, skip, limit, filter, sort) {
        const url = `${this.endpointV4}/assessments?${querystring.stringify({
            skip, limit, filter, sort,
        })}`;
        debug('listAssessment => %s', url);
        return got
            .get(url, { headers: defaultHeaders(token) }).json();
    }

    getAssessment(token, name) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}`;
        debug('getAssessment => %s', url);
        return got
            .get(url, {
            headers: defaultHeaders(token),
        }).json();
    }

    deleteAssessment(token, name) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}`;
        debug('deleteAssessment => %s', url);
        return got
            .delete(url, {
            headers: defaultHeaders(token),
        }).json();
    }

    runAssessment(token, name) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}/run`;
        debug('runAssessment => %s', url);
        return got
            .post(url, {
            headers: defaultHeaders(token),
        }).json();
    }

    listAssessmentReports(token, name) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}/reports`;
        debug('listAssessmentReports => %s', url);
        return got
            .get(url, {
            headers: defaultHeaders(token),
        }).json();
    }

    getAssessmentReport(token, name, reportId) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}/reports/${encodeURIComponent(reportId)}`;
        debug('getAssessmentReport => %s', url);
        return got
            .get(url, {
            headers: defaultHeaders(token),
        }).json();
    }

    exportAssessmentReport(token, name, reportId, types) {
        const options = { color: 'true' };
        const file = `${reportId.split('/').pop()}.csv`;
        const filter = types && types.trim() ? `?components=${types.trim()}` : '';
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}/reports/${encodeURIComponent(reportId)}/export${filter}`;
        debug('exportAssessmentReport => %s', url);
        const rs = got.stream(url, { headers: defaultHeaders(token) });
        pipeline(rs, createWriteStream(file), (e) => {
            if (e) {
                const err = constructError(e);
                printError(`Failed to export assessment "${name}" report "${reportId}": ${err.status} ${err.message}`, options);
            } else {
                printSuccess(`Report exported to file "${file}"`, options);
            }
        });
    }
});
