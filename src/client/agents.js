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

module.exports = class Agents {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = projectId => `${cortexUrl}/fabric/v4/projects/${projectId}`;
    }

    invokeAgentService(projectId, token, agentName, serviceName) {
        const endpoint = `${this.endpointV4(projectId)}/agents/${agentName}/services/${serviceName}`;
        debug('invokeAgentService(%s, %s) => %s', agentName, serviceName, endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
           .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    getActivation(projectId, token, activationId) {
        const endpoint = `${this.endpointV4(projectId)}/activations/${activationId}`;
        debug('getActivation(%s) => %s', activationId, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    listActivations(projectId, token, snapshotId) {
        const endpoint = `${this.endpointV4(projectId)}/snapshots/${snapshotId}/activations`;
        debug('listActivations(%s, %s) => %s', snapshotId, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    listAgentSnapshots(projectId, token, agentName) {
        const endpoint = `${this.endpointV4(projectId)}/agents/${agentName}/snapshots`;
        debug('listAgentSnapshots(%s, %s) => %s', agentName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    describeAgentSnapshot(projectId, token, snapshotId, output) {
        const endpoint = `${this.endpointV4(projectId)}/snapshots/${snapshotId}?deps=true`;
        debug('describeAgentSnapshot(%s, %s) => %s', snapshotId, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { output, deps: true },
            }).text()
            .catch(err => constructError(err));
    }

    createAgentSnapshot(projectId, token, snapshot) {
        const endpoint = `${this.endpointV4(projectId)}/agents/${snapshot.agentName}/snapshots`;
        debug('getAgentSnapshot=> %s', endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: snapshot,
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    listTriggers(projectId, token) {
        const endpoint = `${this.endpointV4(projectId)}/triggers`;
        debug('listTriggers => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }
};
