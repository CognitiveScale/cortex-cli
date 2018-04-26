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
const { constructError } = require('../commands/utils');

module.exports = class Tasks {

    constructor(cortexUrl, jobId) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/jobs/${jobId}/tasks`;
    }

    listTasks(token) {
        const endpoint = `${this.endpoint}`;
        return request
            .get(endpoint)
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

    taskLogs(token, taskId) {
        const endpoint = `${this.endpoint}/${taskId}/logs`;
        return request
            .get(endpoint)
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

    cancelTask(token, taskId, message) {
        const endpoint = `${this.endpoint}/${taskId}/cancel`;
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({message})
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

    describeTask(token, taskId) {
        const endpoint = `${this.endpoint}/${taskId}`;
        return request
            .get(endpoint)
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
};