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
const { got, defaultHeaders } = require('./apiutils');
const { constructError, checkProject } = require('../commands/utils');

module.exports = class Agents {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}`;
    }

    invokeAgentService(projectId, token, agentName, serviceName, params, options) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/agentinvoke/${encodeURIComponent(agentName)}/services/${serviceName}`;
        debug('invokeAgentService(%s, %s) => %s', agentName, serviceName, endpoint);
        return got
            .post(endpoint, {
                headers: defaultHeaders(token),
                json: params,
                searchParams: { sync: options.sync, scheduleName: options.scheduleName, scheduleCron: options.scheduleCron },
            }).json()
           .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    invokeSkill(projectId, token, skillName, inputName, params, sync) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/skillinvoke/${encodeURIComponent(skillName)}/inputs/${inputName}`;
        debug('invokeSkill(%s, %s) => %s', skillName, inputName, endpoint);
        return got
            .post(endpoint, {
                headers: defaultHeaders(token),
                json: params,
                searchParams: { sync },
            }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    getActivation(projectId, token, activationId, verbose, report) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/activations/${activationId}`;
        debug('getActivation(%s, %s, %s) => %s', activationId, verbose, report, endpoint);
        const opts = {
            headers: defaultHeaders(token),
        };
        if (verbose) {
            opts.searchParams = { verbose };
        }
        if (report) {
            opts.searchParams = { report };
        }
        return got
            .get(endpoint, opts).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    listActivations(projectId, token, params) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/activations`;
        debug('listActivations(%s) => %s', params.agentName, endpoint);
        const opts = { headers: defaultHeaders(token) };
        if (params) {
            opts.searchParams = params;
        }
        return got
            .get(endpoint, opts).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    listAgentSnapshots(projectId, token, agentName, filter, limit, skip, sort) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/agents/${encodeURIComponent(agentName)}/snapshots`;
        debug('listAgentSnapshots(%s) => %s', agentName, endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) {
            query.sort = sort;
            query.mongoRawSort = true;
        }
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
                headers: defaultHeaders(token),
                searchParams: query,
            }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    describeAgentSnapshot(projectId, token, snapshotId, output) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/snapshots/${snapshotId}?deps=true`;
        debug('describeAgentSnapshot(%s) => %s', snapshotId, endpoint);
        return got
            .get(endpoint, {
                headers: defaultHeaders(token),
                searchParams: { output, deps: true },
            }).text()
            .catch((err) => constructError(err));
    }

    createAgentSnapshot(projectId, token, snapshot) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/agents/${encodeURIComponent(snapshot.agentName)}/snapshots`;
        debug('createAgentSnapshot(%s)=> %s', snapshot, endpoint);
        return got
            .post(endpoint, {
                headers: defaultHeaders(token),
                json: snapshot,
            }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }
};
