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
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/connections`;
    }

    async queryConnection(token, connectionName, queryObject) {
        const queryEndpoint = `${this.endpoint}/${connectionName}/query`
        debug('queryConnection(%s) => %s', connectionName, queryEndpoint);
        try {
            const res = await request
                .post(queryEndpoint)
                .set('Authorization', `Bearer ${token}`)
                .responseType('blob')
                .send(queryObject);
            if (res.ok) {
                return {success: true, message: res.body};
            }
            return {success: false, message: res.body, status: res.status};
        } catch (err) {
            return constructError(err);
        }
    }

    listConnections(token) {
        const endpoint = `${this.endpoint}`;
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    saveConnection(token, connObj) {
        debug('saveConnection(%s) => %s', connObj.name, this.endpoint);
        return request
            .post(this.endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(connObj)
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeConnection(token, connectionName) {
        const endpoint = `${this.endpoint}/${connectionName}`;
        debug('describeConnection(%s) => %s', connectionName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    testConnection(token, {name, title, description, connectionType, allowWrite, tags, params}) {
        const url = this.endpoint + '/test';
        debug('saveConnection(%s) => %s', name, url);
        return request
            .post(url)
            .set('Authorization', `Bearer ${token}`)
            .send({name, title, description, connectionType, allowWrite, tags, params})
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.message, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listConnectionsTypes(token) {
        const endpoint = `${this.endpoint}/types`;
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

};

