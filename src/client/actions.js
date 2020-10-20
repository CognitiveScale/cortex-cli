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
const chalk = require('chalk');
const debug = require('debug')('cortex:cli');
const got = require('got');
const { constructError, callMe, checkProject } = require('../commands/utils');

module.exports = class Actions {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = projectId =>`${cortexUrl}/fabric/v4/projects/${projectId}/actions`
    }

    async deployAction(projectId, token, actionName, params) {
        checkProject(projectId);
        let endpoint = this.endpointV4(projectId);
        if (params.actionType) {
            endpoint = `${endpoint}?actionType=${params.actionType}`;
        }
        debug('deployAction(%s, docker=%s, ttl=%s) => %s',
            actionName, params.dockerImage, params.ttl, endpoint);

        try {
            params.docker = await this._maybePushDockerImage(params.dockerImage, token, params.pushDocker);
        } catch (error) {
            return {success: false, status: 400, message: error.message || error};
        }

        params.name = actionName;

        return got
        .post(endpoint, {
                   headers: { Authorization: `Bearer ${token}` },
                   json: params,
            })
        .then((res) => {
            if (res.ok) {
                return {success: true, message: res.body};
            }
            return {success: false, status: res.status, message: res.body};
        })
        .catch((err) => {
            return constructError(err);
        });
    }

    listActions(projectId, token) {
        checkProject(projectId);
        debug('listActions() => %s', this.endpointV3);
        return got
            .get(this.endpointV4(projectId), {
                headers: {Authorization: `Bearer ${token}`},
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, actions: res.body.functions};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${actionName}`;
        debug('describeAction(%s) => %s', actionName, endpoint);
        return got
            .get(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    return {success: true, action: res.body.function};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    getLogsAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${actionName}/logs`;
        debug('getLogsAction(%s) => %s', actionName, endpoint);
        return got
            .get(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    if (_.isArray(res.body)) {
                        // returns plain array for Rancher daemons
                        return {success: true, logs: res.body};
                    }
                    return res.body;
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    deleteAction(projectId, token, actionName, actionType) {
        checkProject(projectId);
        let endpoint = `${this.endpointV4(projectId)}/${actionName}`;
        if (actionType) {
            endpoint = `${endpoint}?actionType=${actionType}`
        }
        debug('deleteAction(%s, %s) => %s', actionName, actionType, endpoint);
        return got
            .delete(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    return {success: true, action: res.body.action};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    taskLogs(projectId, token, jobId, taskId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/tasks/${taskId}/logs`;
        return got
            .get(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    return res.body;
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    taskCancel(projectId, token, jobId, taskId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/tasks/${taskId}`;
        return got
            .delete(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    return res.body;
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    taskStatus(projectId, token, jobId, taskId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/tasks/${taskId}/status`;
        return got
            .get(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    const resBody = res.body;
                    debug('resBody (with provider status as well): %s', resBody);
                    const respBodyNoProviderField = _.omit(resBody, '_providerStatus');
                    return respBodyNoProviderField;
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    jobListTasks(projectId, token, jobId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/tasks`;
        return got
            .get(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    return res.body;
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    taskStats(projectId, token, jobId) {
        checkProject(projectId);
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointV4(projectId)}/${canonicalJobId}/stats`;
        return got
            .get(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    return res.body;
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listTasksByActivation(projectId, token, activationId) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${activationId}`;
        return got
            .get(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    return res.body;
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    getConfig(projectId, token) {
        checkProject(projectId);
        const endpoint = _.join([this.endpointV4(projectId), '_config'], '/');
        return got
            .get(endpoint, { headers: {Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.ok) {
                    return {success: true, config: res.body.config};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    static getCanonicalJobId(jobId) {
        let canonicalJobId = jobId;
        const namespaceProvided = /\w\/\w/.test(jobId);
        if (!namespaceProvided) {
            canonicalJobId = `default/${jobId}`;
            console.warn(chalk.yellow(`Namespace not given in jobId, assuming 'default'`));
        }
        return canonicalJobId;
    }

    async _cortexRegistryUrl(token) {
        const res = await this.getConfig(token);
        if (res.success)
            return res.config.dockerPrivateRegistryUrl
        else
            throw res
    }

    _cortexRegistryImagePath(registryUrl, imageRepo, tenant) {
        const imageName = _.split(imageRepo, '/').slice(-1)[0];
        return _.join([registryUrl, tenant, imageName], '/');
    }

    async _maybePushDockerImage(image, token, pushDocker) {
        if (!image || !pushDocker) {
            return image
        }
        const registryUrl = await this._cortexRegistryUrl(token);
        const imageName = image.replace(/.+\..+\//, '');
        const cortexImageUrl = this._cortexRegistryImagePath(registryUrl, imageName, jsonwebtoken.decode(token).tenant);
        await callMe(`docker login -u cli --password ${token} ${registryUrl}`);
        await callMe(`docker pull ${image} || echo "Docker pull failed using local image"`);
        await callMe(`docker tag ${image} ${cortexImageUrl}`);
        await callMe(`docker push ${cortexImageUrl}`);
        return cortexImageUrl;
    }
};
