/*
 * Copyright 2021 Cognitive Scale, Inc. All Rights Reserved.
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
const querystring = require('querystring');
const { pipeline } = require('stream');
const { createWriteStream } = require('fs');
const debug = require('debug')('cortex:cli');
const { got } = require('./apiutils');
const { printSuccess } = require('../commands/utils');
const { printError } = require('../commands/utils');
const { constructError, getUserAgent } = require('../commands/utils');

module.exports = class Assessments {
    constructor(cortexUrl) {
        this.endpointV4 = `${cortexUrl}/fabric/v4/impactassessment`;
    }

    getDependenciesOfResource(token, project, type, name) {
        const url = `${this.endpointV4}/dependencies/${encodeURIComponent(project)}/${encodeURIComponent(type)}/${encodeURIComponent(name)}`;
        debug('queryResources => %s', url);
        return got
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    queryResources(token, name, projectId, type, skip, limit) {
        const url = `${this.endpointV4}/resources?${querystring.stringify({
            projectId, 
            name: encodeURIComponent(name), 
            type, 
            skip, 
            limit,
        })}`;
        debug('queryResources => %s', url);
        return got
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    listResourceTypes(token) {
        const url = `${this.endpointV4}/types`;
        debug('listResourceTypes => %s', url);
        return got
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    createAssessment(token, name, title, description, scope, componentName, componentTypes, overwrite) {
        const url = `${this.endpointV4}/assessments`;
        debug('createAssessment => %s', url);
        return got
            .post(url, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                'user-agent': getUserAgent(),
                body: JSON.stringify({
                    name: encodeURIComponent(name),
                    title,
                    description,
                    scope: encodeURIComponent(scope),
                    componentName: encodeURIComponent(componentName),
                    componentTypes,
                    overwrite,
                }),
            }).json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    listAssessment(token, skip, limit) {
        const url = `${this.endpointV4}/assessments?${querystring.stringify({ skip, limit })}`;
        debug('listAssessment => %s', url);
        return got
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    getAssessment(token, name) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}`;
        debug('getAssessment => %s', url);
        return got
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    deleteAssessment(token, name) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}`;
        debug('deleteAssessment => %s', url);
        return got
            .delete(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    runAssessment(token, name) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}/run`;
        debug('runAssessment => %s', url);
        return got
            .post(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    listAssessmentReports(token, name) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}/reports`;
        debug('listAssessmentReports => %s', url);
        return got
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    getAssessmentReport(token, name, reportId) {
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}/reports/${encodeURIComponent(reportId)}`;
        debug('getAssessmentReport => %s', url);
        return got
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    exportAssessmentReport(token, name, reportId, types) {
        const options = { color: 'on' };
        const file = `${reportId.split('/').pop()}.csv`;
        const filter = types && types.trim() ? `?components=${types.trim()}` : '';
        const url = `${this.endpointV4}/assessments/${encodeURIComponent(name)}/reports/${encodeURIComponent(reportId)}/export${filter}`;
        debug('exportAssessmentReport => %s', url);

        const rs = got.stream(url, { headers: { Authorization: `Bearer ${token}` }, 'user-agent': getUserAgent() });
        pipeline(rs, createWriteStream(file), (e) => {
            if (e) {
                const err = constructError(e);
                printError(`Failed to export assessment "${name}" report "${reportId}": ${err.status} ${err.message}`, options);
            } else {
                printSuccess(`Report exported to file "${file}"`, options);
            }
        });
    }
};
