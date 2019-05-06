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

const  { request } = require('../commands/apiutils');
const debug = require('debug')('cortex:cli');
const { constructError } = require('../commands/utils');

module.exports = class Environments {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/agents/environments`;
    }

    listEnvironments(token) {
        const endpoint = `${this.endpoint}`;
        return request
            .get(endpoint)
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

    saveEnvironment(token, env) {
        debug('saveEnvironment(%s) => %s', env.name, this.endpoint);
        return request
            .post(this.endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(env)
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }
    promoteEnvironment(token, promoteDef) {
        debug('promoteEnvironment(%s) => %s', promoteDef.environmentName, this.endpoint);
        return request
            .post(`${this.endpoint}/promote`)
            .set('Authorization', `Bearer ${token}`)
            .send(promoteDef)
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeEnvironment(token, environmentName) {
        const endpoint = `${this.endpoint}/${environmentName}`;
        debug('describeEnvironment(%s) => %s', environmentName, endpoint);
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
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listInstances(token, environmentName) {
        const endpoint = `${this.endpoint}/${environmentName}/instances`;
        debug('listInstances(%s) => %s', environmentName, this.endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }
};

