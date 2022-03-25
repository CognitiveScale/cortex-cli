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
const debug = require('debug')('cortex:cli');
const { got } = require('./apiutils');
const {
    constructError, checkProject, getUserAgent,
} = require('../commands/utils');

module.exports = class Sessions {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/sessions`;
    }

    saveSession(projectId, token, sessionObj) {
        checkProject(projectId);
        const endpoint = this.endpointV4(projectId);
        debug('saveSession(%s) => %s', sessionObj.name, endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: sessionObj,
            }).json()
            .then((res) => ({ success: true, message: res }))
            .catch((err) => constructError(err));
    }

    deleteSession(projectId, token, sessionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(sessionName)}`;
        debug('deleteSession(%s) => %s', sessionName, endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then((session) => ({ success: true, session }))
            .catch((err) => constructError(err));
    }

    describeSession(projectId, token, sessionName, verbose) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(sessionName)}`;
        debug('describeSession(%s) => %s', sessionName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { verbose },
            }).json()
            .then((session) => ({ success: true, session }))
            .catch((err) => constructError(err));
    }

    listSessions(projectId, token, limit) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}?limit=${limit}`;
        debug('listSessions() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then((sessionsResp) => ({ success: true, ...sessionsResp }))
            .catch((err) => constructError(err));
    }
};
