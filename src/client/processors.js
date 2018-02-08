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

const request = require('superagent');
const debug = require('debug')('cortex:cli');

module.exports = class Processors {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/processors`;
    }

    listRuntimeTypes(token) {
        const endpoint = `${this.endpoint}/runtime-types`;
        debug('listRuntimeTypes() => %s', endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, runtimeTypes: res.body.runtimeTypes};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    listRuntimes(token) {
        const endpoint = `${this.endpoint}/runtimes`;
        debug('listRuntimes() => %s', endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, runtimes: res.body.runtimes};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    describeRuntime(token, runtimeName) {
        const endpoint = `${this.endpoint}/runtimes/${runtimeName}`;
        debug('describeRuntime(%s) => %s', runtimeName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, runtme: res.body.runtime};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    saveRuntime(token, {name, title, description, runtimeType, params}) {
        const endpoint = `${this.endpoint}/runtimes`;
        debug('saveRuntime(%s) => %s', name, endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({name, title, description, runtimeType, params})
            .then((res) => {
                if (res.ok) {
                    return {success: true, version: res.body.version};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    deleteRuntime(token, runtimeName) {
        const endpoint = `${this.endpoint}/runtimes/${runtimeName}`;
        debug('deleteRuntime(%s) => %s', runtimeName, endpoint);
        return request
            .delete(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    listRuntimeActions(token, runtimeName) {
        const endpoint = `${this.endpoint}/runtimes/${runtimeName}/actions`;
        debug('listRuntimeActions() => %s', endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, actions: res.body.actions};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    invokeRuntimeAction(token, runtimeName, actionId, params) {
        const endpoint = `${this.endpoint}/runtimes/${runtimeName}/actions/invoke`;
        debug('invokeRuntimeAction(%s, %s) => %s', runtimeName, actionId, endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({actionId: actionId, params: params})
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }
};