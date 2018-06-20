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
const { constructError } = require('../commands/utils');

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
            })
            .catch((err) => {
                return constructError(err);
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
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listAgentSnapshots(token, agentName, environmentName) {
        let endpoint = `${this.endpoint}/snapshots/${agentName}`;
        debug('listAgentSnapshots(%s, %s) => %s', agentName, environmentName, endpoint);
        if (environmentName) endpoint = `${endpoint}?environmentName=${environmentName}`;
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

    describeAgentSnapshot(token, snapshotId, environmentName) {
        let endpoint = `${this.endpoint}/snapshots/${snapshotId}?deps=true`;
        debug('describeAgentSnapshot(%s, %s) => %s', snapshotId, environmentName, endpoint);
        if (environmentName) endpoint = `${endpoint}&environmentName=${environmentName}`;
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

    createAgentSnapshot(token, snapshot) {
        const endpoint = `${this.endpoint}/snapshots`;
        debug('getAgentSnapshot=> %s', endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(snapshot)
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

    listAgentInstances(token, agentName) {
        const endpoint = `${this.endpoint}/instances/${agentName}`;
        debug('getAgentInstances(%s) => %s', agentName, endpoint);
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

    createAgentInstance(token, instance) {
        const endpoint = `${this.endpoint}/instances`;
        debug('createAgentInstance => %s', endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(instance)
            .type('json')
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

    getAgentInstance(token, instanceId) {
        const endpoint = `${this.endpoint}/instances/${instanceId}`;
        debug('getAgentInstance => %s', endpoint);
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

    deleteAgentInstance(token, instanceId) {
        const endpoint = `${this.endpoint}/instances/${instanceId}`;
        debug('deleteAgentInstance => %s', endpoint);
        return request
            .delete(endpoint)
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

    stopAgentInstance(token, instanceId) {
        const endpoint = `${this.endpoint}/instances/${instanceId}/stop`;
        debug('stopAgentInstance => %s', endpoint);
        return request
            .post(endpoint)
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

    listTriggers(token) {
        const endpoint = `${this.endpoint}/triggers`;
        debug('listTriggers => %s', endpoint);
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