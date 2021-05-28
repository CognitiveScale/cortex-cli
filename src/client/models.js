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
const {
    constructError, checkProject, getUserAgent,
} = require('../commands/utils');


module.exports = class Models {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = projectId => `${cortexUrl}/fabric/v4/projects/${projectId}/models`;
    }

    saveModel(projectId, token, modelObj) {
        checkProject(projectId);
        const endpoint = this.endpointV4(projectId);
        debug('saveModel(%s) => %s', modelObj.name, endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: modelObj,
            }).json()
            .then(res => ({ success: true, message: res }))
            .catch(err => constructError(err));
    }

    deleteModel(projectId, token, modelName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(modelName)}`;
        debug('deleteAction(%s) => %s', modelName, endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(model => ({ success: true, model }))
            .catch(err => constructError(err));
    }

    listModels(projectId, token) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}`;
        debug('listModels() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(modelResp => ({ success: true, ...modelResp }))
            .catch(err => constructError(err));
    }


    describeModel(projectId, token, modelName, verbose) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(modelName)}`;

        debug('describeAgent(%s) => %s', modelName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { verbose },
            }).json()
            .then(model => ({ success: true, model }))
            .catch(err => constructError(err));
    }

    describeModelVersions(projectId, token, modelName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(modelName)}/versions`;

        debug('describeAgentVersions(%s) => %s', modelName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(model => ({ success: true, model }))
            .catch(err => constructError(err));
    }
};
