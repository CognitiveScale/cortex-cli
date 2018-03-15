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

module.exports = class Agents {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/agents`;
        this.endpointV3 = `${cortexUrl}/v3/agents`;
    }

    invokeAgentService(token, agentName, serviceName, params) {
        const endpoint = `${this.endpointV3}/${agentName}/services/${serviceName}`;
        debug('invokeAgentService(%s, %s) => %s', agentName, serviceName, endpoint);
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

    getServiceActivation(token, activationId) {
        const endpoint = `${this.endpointV3}/services/activations/${activationId}`;
        debug('getServiceActivation(%s) => %s', activationId, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    getAgentSnapshot(token, agentName) {
        const endpoint = `${this.endpoint}/snapshots/${agentName}`;
        debug('getAgentSnapshot(%s) => %s', agentName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }
};