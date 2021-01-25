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
const { constructError, getUserAgent } = require('../commands/utils');

module.exports = class Connections {
    constructor(cortexUrl) {
        this.endpoint = projectId => `${cortexUrl}/fabric/v4/projects/${projectId}/connections`;
        this.cortexUrl = cortexUrl;
    }

    async queryConnection(projectId, token, connectionName, queryObject) {
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(connectionName)}/query`;
        debug('queryConnection(%s) => %s', connectionName, endpoint);
        try {
            const message = await got
                .post(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                    'user-agent': getUserAgent(),
                    json: queryObject,
            }).json();
            return { success: true, message };
        } catch (err) {
            return constructError(err);
        }
    }

    listConnections(projectId, token) {
        const endpoint = `${this.endpoint(projectId)}`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    async saveConnection(projectId, token, connObj) {
        const endpoint = `${this.endpoint(projectId)}`;
        debug('saveConnection(%s) => %s', connObj.name, this.endpoint(projectId));
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

    async testConnection(projectId, token, {
         name, title, description, connectionType, allowWrite, tags, params,
    }) {
        const url = `${this.cortexUrl}/fabric/v4/projects/${projectId}/connectiontest`;
        debug('saveConnection(%s) => %s', name, url);
        try {
            const message = await got
                .post(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    'user-agent': getUserAgent(),
                    json: {
                        name, title, description, connectionType, allowWrite, tags, params,
                    },
                }).json();
            return { success: true, message };
        } catch (err) {
            return constructError(err);
        }
    }

    listConnectionsTypes(token) {
        const endpoint = `${this.cortexUrl}/fabric/v4/connectiontypes`;
          return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }
};
