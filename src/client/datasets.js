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
const got = require('got');
const { constructError, getUserAgent } = require('../commands/utils');

module.exports = class Datasets {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = projectId => `${cortexUrl}/fabric/v4/projects/${projectId}/datasets`;
    }

    listDatasets(projectId, token) {
        const endpoint = `${this.endpoint(projectId)}`;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    saveDatasets(projectId, token, dsObject) {
        const endpoint = `${this.endpoint(projectId)}`;
        debug('saveConnection(%s) => %s', dsObject.name, this.endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: dsObject,
            }).json()
            .then(res => ({ success: true, message: res }))
            .catch(err => constructError(err));
    }

    describeDataset(projectId, token, datasetName) {
        const endpoint = `${this.endpoint(projectId)}/${datasetName}`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err)); 
}

    getDataframe(projectId, token, datasetName) {
        const endpoint = `${this.endpoint(projectId)}/${datasetName}/dataframe`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    streamDataset(projectId, token, datasetName) {
        const endpoint = `${this.endpoint(projectId)}/${datasetName}/stream`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }
};
