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

const url = require('url');
const chalk = require('chalk');
const  { request } = require('../commands/apiutils');
const debug = require('debug')('cortex:cli');
const _ = require('lodash');
const jsonwebtoken = require('jsonwebtoken');
const { constructError, callMe } = require('../commands/utils');

module.exports = class Actions {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/actions`;
        this.endpointV3 = `${cortexUrl}/v3/actions`;
        this.endpointJobsV3 = `${cortexUrl}/v3/jobs`;
    }

    invokeAction(token, actionName, params, actionType) {
        let endpoint = `${this.endpointV3}/${actionName}/invoke`;
        if (actionType) {
            endpoint = `${endpoint}?actionType=${actionType}`
        }
        debug('invokeAction(%s) => %s', actionName, endpoint);

        const req = request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(params);

        return req.then((res) => {
            if (res.ok) {
                return {success: true, result: res.body};
            }
            return {success: false, status: res.status, message: res.body};
        })
            .catch((err) => {
            return constructError(err);
        });
    }

    async deployAction(token, actionName, docker, kind, code, memory, vcpus, ttl, actionType, command, port, environment, environmentVariables, pushDocker, scaleCount) {
        let endpoint = `${this.endpointV3}`;
        if (actionType) {
            endpoint = `${endpoint}?actionType=${actionType}`;
        }
        debug('deployAction(%s, docker=%s, kind=%s, code=%s, memory=%s, vcpus=%s, ttl=%s) => %s',
            actionName, docker, kind, code, memory, vcpus, ttl, endpoint);

        try {
            docker = await this._maybePushDockerImage(docker, token, pushDocker);
        } catch (error) {
            return {success: false, status: 400, message: error.message || error};
        }

        const req = request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .field('name', actionName);

        if (docker) req.field('docker', docker);
        if (kind) req.field('kind', kind);
        if (_.isFinite(memory)) req.field('memory', memory);
        if (_.isFinite(vcpus)) req.field('vcpus', vcpus);
        if (!_.isNil(ttl)) req.field('ttl', ttl);
        if (code) req.attach('code', code);
        if (command) req.field('command', command);
        if (port) req.field('port', port);
        if (environment) req.field('environment', environment);
        if (environmentVariables) req.field('environmentVariables', environmentVariables);
        if (_.isFinite(scaleCount)) req.field('scaleCount', scaleCount);

        return req.then((res) => {
            if (res.ok) {
                return {success: true, message: res.body};
            }
            return {success: false, status: res.status, message: res.body};
        })
            .catch((err) => {
            return constructError(err);
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
            })
            .catch((err) => {
                return constructError(err);
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
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    getLogsAction(token, actionName) {
        const endpoint = `${this.endpointV3}/${actionName}/logs`;
        debug('getLogsAction(%s) => %s', actionName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
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
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    taskLogs(token, jobId, taskId) {
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointJobsV3}/${canonicalJobId}/tasks/${taskId}/logs`;
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
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

    taskCancel(token, jobId, taskId) {
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointJobsV3}/${canonicalJobId}/tasks/${taskId}`;
        return request
            .delete(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
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

    taskStatus(token, jobId, taskId) {
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointJobsV3}/${canonicalJobId}/tasks/${taskId}/status`;
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
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

    jobListTasks(token, jobId) {
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointJobsV3}/${canonicalJobId}/tasks`;
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
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

    taskStats(token, jobId) {
        const canonicalJobId = Actions.getCanonicalJobId(jobId);
        const endpoint = `${this.endpointJobsV3}/${canonicalJobId}/stats`;
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
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

    listTasksByActivation(token, activationId) {
        const endpoint = `${this.endpointV3}/${activationId}`;
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
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

    getConfig(token) {
        return request
            .get(_.join([this.endpointV3, '_config'], '/'))
            .set('Authorization', `Bearer ${token}`)
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

    _stripCortexPullthroughRegistry(image) {
        return image.replace(/^registry\.cortex.*\.insights\.ai:5000\//, '')
    }

    async _maybePushDockerImage(image, token, pushDocker) {
        if (!image || !pushDocker) {
            return image
        }
        const imageClean = this._stripCortexPullthroughRegistry(image);
        const registryUrl = await this._cortexRegistryUrl(token);
        const imageName = image.replace(/.+\..+\//, '');
        const cortexImageUrl = this._cortexRegistryImagePath(registryUrl, imageName, jsonwebtoken.decode(token).tenant);

        await callMe(`docker login -u cli --password ${token} ${registryUrl}`);
        await callMe(`docker pull ${imageClean} || echo "Docker pull failed using local image"`);
        await callMe(`docker tag ${imageClean} ${cortexImageUrl}`);
        await callMe(`docker push ${cortexImageUrl}`);
        return cortexImageUrl;
    }
};
