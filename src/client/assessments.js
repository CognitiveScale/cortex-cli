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
const { createWriteStream } = require("fs");
const debug = require('debug')('cortex:cli');
const { got } = require('./apiutils');
const { constructError, getUserAgent } = require('../commands/utils');

module.exports = class Assessments {
    constructor(cortexUrl) {
        this.endpointV4 = `${cortexUrl}/fabric/v4/impactassessment`;
    }

    queryResources(token, name, projectId, type, skip, limit) {
        const url = `${this.endpointV4}/resources?${querystring.stringify({ projectId, name, type, skip, limit })}`;
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

    createAssessment(token, name, title, description, scope, componentName, componentTypes) {
        const url = `${this.endpointV4}/assessments`;
        debug('createAssessment => %s', url);
        return got
            .post(url, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                'user-agent': getUserAgent(),
                body: JSON.stringify({ name, title, description, scope, componentName, componentTypes }),
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
        const url = `${this.endpointV4}/assessments/${name}`;
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
        const url = `${this.endpointV4}/assessments/${name}`;
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
        const url = `${this.endpointV4}/assessments/${name}/run`;
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
        const url = `${this.endpointV4}/assessments/${name}/reports`;
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
        const url = `${this.endpointV4}/assessments/${name}/reports/${reportId}`;
        debug('getAssessmentReport => %s', url);
        return got
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    exportAssessmentReport(token, name, reportId) {
        const url = `${this.endpointV4}/assessments/${name}/reports/${reportId}/export`;
        debug('exportAssessmentReport => %s', url);
        got.stream(url, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).pipe(createWriteStream(`${reportId}.csv`), { end: true });
        return Promise.resolve({ file: `${reportId}.csv`});
    }
};
