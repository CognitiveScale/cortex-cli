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

    invokeAction(token, actionName, params) {
        const endpoint = `${this.endpointV3}/${actionName}/invoke`;
        debug('invokeAction(%s) => %s', actionName, endpoint);

        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(params)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    deployAction(token, actionName, docker, kind, code, memory, timeout) {
        const endpoint = `${this.endpointV3}?overwrite=true`;
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

    describeAction(token, actionName, download) {
        const endpoint = `${this.endpointV3}/${actionName}?download=${download}`;
        debug('describeAction(%s) => %s', actionName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, action: res.body.action};
                }
                return {success: false, status: res.status, message: res.body};
            });

    }
};