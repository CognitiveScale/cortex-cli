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
const Actions = require('./actions');

module.exports = class Jobs {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/jobs`;
    }

    listJobs(token) {
        const endpoint = `${this.endpoint}`;
        return getRequest(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return { success: true, result: res.body };
                }
                return { success: false, status: res.status, message: res.body };
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeJob(token, name) {
        const endpoint = `${this.endpoint}/${name}`;
        return getRequest(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return { success: true, result: res.body };
                }
                return { success: false, status: res.status, message: res.body };
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    jobStatus(token, jobDefinition) {
        const endpoint = `${this.endpoint}/${jobDefinition}/stats`;
        return getRequest(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return { success: true, result: res.body };
                    }
                    return { success: false, status: res.status, message: res.body };
                })
            .catch((err) => {
                return constructError(err);
            });
    }

    async saveJob(token, {name, image, command, memory, vcpus, environment}, pushDocker) {
        const action = new Actions(this.cortexUrl);
        try {
            image = await action._maybePushDockerImage(image, token, pushDocker);
        } catch (error) {
            return {success: false, status: 400, message: error.message || error};
        }

        return request
            .post(this.endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({name, image, command, memory, vcpus, environment})
            .then((res) => {
                if (res.ok) {
                    return { success: true, result: res.body };
                    }
                    return { success: false, status: res.status, message: res.body };
                })
            .catch((err) => {
                return constructError(err);
            });
    }
};