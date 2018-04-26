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
const debug = require('debug')('cortex:cli');

module.exports = class Datasets {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v3/datasets`;
    }

    listDatasets(token) {
        const endpoint = `${this.endpoint}`;
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
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
            }).catch((err) => {
                const errorText = JSON.parse(err.response.text);
                return {success: false, message: errorText.message, status: errorText.code}; // TODO do we want the internal code or the response code?
            });
    }

    describeDataset(token, datasetName) {
        const endpoint = `${this.endpoint}/${datasetName}`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            });
    }

    getDataframe (token, datasetName) {
        const endpoint = `${this.endpoint}/${datasetName}/dataframe`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            });
    }

    streamDataset(token, datasetName) {
        const endpoint = `${this.endpoint}/${datasetName}/stream`;
        debug('describeConnection(%s) => %s', datasetName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .buffer()
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            }).catch((err) => {
                printError(`Failed to stream dataset ${datasetName}: ${err.status} ${err.message}`, options);
            });
    }
};
