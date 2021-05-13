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
const { constructError, getUserAgent, checkProject } = require('../commands/utils');

module.exports = class Connections {
    constructor(cortexUrl) {
        this.endpoint = projectId => `${cortexUrl}/fabric/v4/projects/${projectId}/connections`;
        this.cortexUrl = cortexUrl;
    }

    listConnections(projectId, token) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}`;
        debug('listConnections() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    async saveConnection(projectId, token, connObj) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}`;
        debug('saveConnection(%s) => %s', connObj.name, endpoint);
        try {
            const message = await got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: connObj,
            }).json();
            return { success: true, message };
        } catch (err) {
            return constructError(err);
        }
    }

    describeConnection(projectId, token, connectionName) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(connectionName)}`;
        debug('describeConnection(%s) => %s', connectionName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    listConnectionsTypes(token) {
        const endpoint = `${this.cortexUrl}/fabric/v4/connectiontypes`;
        debug('listConnectionsTypes() => %s', endpoint);
          return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }
};
