/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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

const  { request } = require('../commands/apiutils');
const debug = require('debug')('cortex:cli');
const { constructError } = require('../commands/utils');

module.exports = class Connections {

    constructor(cortexUrl) {
        this.endpoint = projectId => `${cortexUrl}/fabric/v4/projects/${projectId}/connections`;
    }

    async queryConnection(projectId, token, connectionName, queryObject) {
        const queryEndpoint = `${this.endpoint(projectId)}/${connectionName}/query`
        debug('queryConnection(%s) => %s', connectionName, queryEndpoint);
        try {
            const message = await got
                .post(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                    json: queryObject
            }).json()
            return {success: true, message};
        } catch (err) {
            return constructError(err);
        }
    }

    listConnections(token) {
        const endpoint = `${this.endpoint(projectId)}`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then((result) => {
                    return {success: true, result};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    async saveConnection(projectId, token, connObj) {
        debug('saveConnection(%s) => %s', connObj.name, this.endpoint(projectId));
        try {
            const message = await got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                json: connObj
            }).json()
            return {success: true, message};
        } catch (err) {
            return constructError(err);
        }
    }

    describeConnection(projectId, token, connectionName) {
        const endpoint = `${this.endpoint(projectId)}/${connectionName}`;
        debug('describeConnection(%s) => %s', connectionName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then((result) => {
                return {success: true, result};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    async testConnection(projectId, token, {name, title, description, connectionType, allowWrite, tags, params}) {
        const url = this.endpoint(projectId) + '/test';
        debug('saveConnection(%s) => %s', name, url);
        try {
            const message = await got
                .post(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    json: {name, title, description, connectionType, allowWrite, tags, params}
                }).json()
            return {success: true, message};
        } catch (err) {
            return constructError(err);
        }
    }

    listConnectionsTypes(token) {
        const endpoint = `${this.endpoint(projectId)}/types`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then((result) => {
                return {success: true, result};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

};

