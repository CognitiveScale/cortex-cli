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
const { getRequest }  = require('../commands/utils/apiutils');

const debug = require('debug')('cortex:cli');
const { constructError } = require('../commands/utils/baseutils');

module.exports = class Datasets {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v3/datasets`;
    }

    listDatasets(token) {
        const endpoint = `${this.endpoint}`;
        return getRequest(endpoint)
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

    saveDatasets(token,dsObject) {
        debug('saveConnection(%s) => %s', dsObject.name, this.endpoint);
        return request
            .post(this.endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(dsObject)
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status}; // don't think we ever hit this
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeDataset(token, datasetName) {
        const endpoint = `${this.endpoint}/${datasetName}`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return getRequest(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    getDataframe (token, datasetName) {
        const endpoint = `${this.endpoint}/${datasetName}/dataframe`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return getRequest(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    streamDataset(token, datasetName) {
        const endpoint = `${this.endpoint}/${datasetName}/stream`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return getRequest(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .buffer()
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }
};
