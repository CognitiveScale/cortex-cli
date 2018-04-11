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

module.exports = class Actions {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/actions`;
        this.endpointV3 = `${cortexUrl}/v3/actions`;
    }

    invokeAction(token, actionName, path, params, actionType, method) {
        let endpoint = `${this.endpointV3}/${actionName}/invoke`;
        if (path) {
            endpoint = `${endpoint}/${path}`
        }
        if (actionType) {
            endpoint = `${endpoint}?actionType=${actionType}`
        }
        debug('invokeAction(%s) => %s', actionName, endpoint);

        const req = request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(params);

        if (method) req.field('method', method);

        return req.then((res) => {
            if (res.ok) {
                return {success: true, result: res.body};
            }
            return {success: false, status: res.status, message: res.body};
        });
    }

    deployAction(token, actionName, docker, kind, code, memory, timeout, actionType, command, ports, environment) {
        let endpoint = `${this.endpointV3}`;
        if (actionType) {
            endpoint = `${endpoint}?actionType=${actionType}`;
        }
        debug('deployAction(%s, docker=%s, kind=%s, code=%s, memory=%s, timeout=%s) => %s',
            actionName, docker, kind, code, memory, timeout, endpoint);

        const req = request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .field('name', actionName);

        if (docker) req.field('docker', docker);
        if (kind) req.field('kind', kind);
        if (memory) req.field('memory', memory);
        if (timeout) req.field('timeout', timeout);
        if (code) req.attach('code', code);
        if (command) req.field('command', command);
        if (ports) req.field('ports', ports);
        if (environment) req.field('environment', environment);

        return req.then((res) => {
            if (res.ok) {
                return {success: true, message: res.body};
            }
            return {success: false, status: res.status, message: res.body};
        });
    }

    listActions(token) {
        debug('listActions() => %s', this.endpointV3);
        return request
            .get(this.endpointV3)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, actions: res.body.functions};
                }
                return {success: false, status: res.status, message: res.body};
            });

    }

    describeAction(token, actionName) {
        const endpoint = `${this.endpointV3}/${actionName}`;
        debug('describeAction(%s) => %s', actionName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, action: res.body.function};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    deleteAction(token, actionName, actionType) {
        let endpoint = `${this.endpointV3}/${actionName}`;
        if (actionType) {
            endpoint = `${endpoint}?actionType=${actionType}`
        }
        debug('deleteAction(%s, %s) => %s', actionName, actionType, endpoint);
        return request
            .delete(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
            .then((res) => {
                if (res.ok) {
                    return {success: true, action: res.body.action};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }
};