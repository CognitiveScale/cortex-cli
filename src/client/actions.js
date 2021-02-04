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
const _ = require('lodash');
const debug = require('debug')('cortex:cli');
const jose = require('jose');
const { got } = require('./apiutils');
const {
 constructError, callMe, checkProject, getUserAgent, 
} = require('../commands/utils');

module.exports = class Actions {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = projectId => `${cortexUrl}/fabric/v4/projects/${projectId}/actions`;
    }

    async deployAction(projectId, token, actionInst) {
        checkProject(projectId);
        let endpoint = this.endpointV4(projectId);
        if (actionInst.actionType) {
            endpoint = `${endpoint}?actionType=${actionInst.actionType}`;
        }
        debug('deployAction(%s, docker=%s, ttl=%s) => %s',
            actionInst.name, actionInst.dockerImage, actionInst.ttl, endpoint);
        const body = { ...actionInst };
        // image & docker floating around fixup just in case..
        if (body.docker) {
            body.image = body.docker;
            delete body.docker;
        }
        try {
            body.docker = await this._maybePushDockerImage(actionInst.dockerImage, token, actionInst.pushDocker);
        } catch (error) {
            return { success: false, status: 400, message: error.message || error };
        }

        return got
        .post(endpoint, {
                   headers: { Authorization: `Bearer ${token}` },
                    'user-agent': getUserAgent(),
                   json: body,
            }).json()
        .then(res => ({ success: true, message: res }))
        .catch(err => constructError(err));
    }

    listActions(projectId, token) {
        checkProject(projectId);
        debug('listActions() => %s', this.endpointV3);
        return got
            .get(this.endpointV4(projectId), {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(actions => actions)
            .catch(err => constructError(err));
    }

    describeAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}`;
        debug('describeAction(%s) => %s', actionName, endpoint);
        return got
            .get(endpoint, { headers: { Authorization: `Bearer ${token}` } })
            .json()
            .then(action => action)
            .catch(err => constructError(err));
    }

    getLogsAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}/logs`;
        debug('getLogsAction(%s) => %s', actionName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then((logs) => {
                    if (_.isArray(logs)) {
                        // returns plain array for Rancher daemons
                        return { success: true, logs };
                    }
                    return logs;
            })
            .catch(err => constructError(err));
    }

    deleteAction(projectId, token, actionName, actionType) {
        checkProject(projectId);
        let endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}`;
        if (actionType) {
            endpoint = `${endpoint}?actionType=${actionType}`;
        }
        debug('deleteAction(%s, %s) => %s', actionName, actionType, endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(action => ({ success: true, action }))
            .catch(err => constructError(err));
    }

    taskLogs(projectId, token, jobId, taskId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/tasks/${taskId}/logs`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    taskCancel(projectId, token, jobId, taskId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/tasks/${taskId}`;
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    taskStatus(projectId, token, jobId, taskId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/tasks/${taskId}/status`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then((res) => {
                    debug('resBody (with provider status as well): %s', res);
                    return _.omit(res, '_providerStatus');
            })
            .catch(err => constructError(err));
    }

    jobListTasks(projectId, token, jobId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/tasks`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    taskStats(projectId, token, jobId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/stats`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    listTasksByActivation(projectId, token, activationId) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${activationId}`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => res)
            .catch(err => constructError(err));
    }

    getConfig(projectId, token) {
        checkProject(projectId);
        const endpoint = _.join([this.endpointV4(projectId), '_config'], '/');
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(config => ({ success: true, config }))
            .catch(err => constructError(err));
    }

    static getCanonicalJobId(jobId) {
        let canonicalJobId = jobId;
        const namespaceProvided = /\w\/\w/.test(jobId);
        if (namespaceProvided) {
            canonicalJobId = encodeURIComponent(jobId);
        }
        return canonicalJobId;
    }

    async _cortexRegistryUrl(token) {
        const res = await this.getConfig(token);
        if (res.success) return res.config.dockerPrivateRegistryUrl;
        throw res;
    }

    _cortexRegistryImagePath(registryUrl, imageRepo, tenant) {
        const imageName = _.split(imageRepo, '/').slice(-1)[0];
        return _.join([registryUrl, tenant, imageName], '/');
    }

    async _maybePushDockerImage(image, token, pushDocker) {
        if (!image || !pushDocker) {
            return image;
        }
        const registryUrl = await this._cortexRegistryUrl(token);
        const imageName = image.replace(/.+\..+\//, '');
        const cortexImageUrl = this._cortexRegistryImagePath(registryUrl, imageName, jose.JWT.decode(token).tenant);
        await callMe(`docker login -u cli --password ${token} ${registryUrl}`);
        await callMe(`docker pull ${image} || echo "Docker pull failed using local image"`);
        await callMe(`docker tag ${image} ${cortexImageUrl}`);
        await callMe(`docker push ${cortexImageUrl}`);
        return cortexImageUrl;
    }
};
