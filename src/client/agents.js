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

    invokeAgentService(projectId, token, agentName, serviceName, params) {
        const endpoint = `${this.endpointV4(projectId)}/agentinvoke/${encodeURIComponent(agentName)}/services/${serviceName}`;
        debug('invokeAgentService(%s, %s) => %s', agentName, serviceName, endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: params,
            }).json()
           .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    invokeSkill(projectId, token, skillName, inputName, params) {
        const endpoint = `${this.endpointV4(projectId)}/skillinvoke/${encodeURIComponent(skillName)}/inputs/${inputName}`;
        debug('invokeSkill(%s, %s) => %s', skillName, inputName, endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: params,
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    getActivation(projectId, token, activationId, verbose) {
        const endpoint = `${this.endpointV4(projectId)}/activations/${activationId}`;
        debug('getActivation(%s) => %s', activationId, endpoint);
        const opts = {
            headers: { Authorization: `Bearer ${token}` },
            'user-agent': getUserAgent(),
        };
        if (verbose) {
            opts.searchParams = { verbose: true };
        }
        return got
            .get(endpoint, opts).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    listActivations(projectId, token, agentName, params) {
        const endpoint = `${this.endpointV4(projectId)}/agentinvoke/${agentName}/activations`;
        debug('listActivations(%s, %s) => %s', agentName, endpoint);
        const opts = {
            headers: { Authorization: `Bearer ${token}` },
            'user-agent': getUserAgent(),
        };
        if (params) {
            opts.searchParams = params;
        }
        return got
            .get(endpoint, opts).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    listAgentSnapshots(projectId, token, agentName) {
        const endpoint = `${this.endpointV4(projectId)}/agents/${encodeURIComponent(agentName)}/snapshots`;
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
        const endpoint = `${this.endpointV4(projectId)}/agents/${encodeURIComponent(snapshot.agentName)}/snapshots`;
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
};
