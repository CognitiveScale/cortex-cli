/*
 * Copyright 2023 Cognitive Scale, Inc. All Rights Reserved.
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
import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { constructError, checkProject } from '../commands/utils.js';

const debug = debugSetup('cortex:cli');
export default (class Models {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/models`;
    }

    saveModel(projectId, token, modelObj) {
        checkProject(projectId);
        const endpoint = this.endpointV4(projectId);
        debug('saveModel(%s) => %s', modelObj.name, endpoint);
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: modelObj,
        }).json()
            .then((res) => ({ success: true, message: res }))
            .catch((err) => constructError(err));
    }

    updateModelStatus(projectId, token, modelName, status) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${modelName}/${status}`;
        debug('updateModelStatus(%s) => %s', modelName, status, endpoint);
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: {},
        }).json()
            .then((res) => ({ success: true, message: res }))
            .catch((err) => constructError(err));
    }

    deleteModel(projectId, token, modelName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(modelName)}`;
        debug('deleteAction(%s) => %s', modelName, endpoint);
        return got
            .delete(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((model) => ({ success: true, model }))
            .catch((err) => constructError(err));
    }

    describeModel(projectId, token, modelName, verbose) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(modelName)}`;
        debug('describeModel(%s) => %s', modelName, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: { verbose },
        }).json()
            .then((model) => ({ success: true, model }))
            .catch((err) => constructError(err));
    }

    listModels(projectId, skip, limit, filter, sort, tags, token) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}`;
        debug('listModels() => %s', endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        if (tags) query.tags = tags;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        })
            .json()
            .then((modelsResp) => ({ success: true, ...modelsResp }))
            .catch((err) => constructError(err));
    }

    listModelRuns(projectId, modelName, token, filter, limit, skip, sort) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${modelName}/experiments/runs`;
        debug('listModels() => %s', endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        })
            .json()
            .then((modelsResp) => ({ success: true, ...modelsResp }))
            .catch((err) => constructError(err));
    }
});
