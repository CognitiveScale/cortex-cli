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

const debug = require('debug')('cortex:cli');
const  { request } = require('../commands/apiutils');

const { constructError } = require('../commands/utils');

module.exports = class Variables {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/tenants/secrets/variables`;
    }

    listVariables(token) {
        const endpoint = `${this.endpoint}?list=true`;
        debug('listVariables => %s', endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
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

    readVariable(token, keyName) {
        const endpoint = `${this.endpoint}/${keyName}`;
        const body = {}
        debug('readVariable($s) => %s', keyName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
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

    writeVariable(token, keyName, value) {
        const endpoint = `${this.endpoint}/${keyName}`;
        debug('writeVariable(%s) => %s', keyName, endpoint);
        const body = { value };
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send(body)
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
};
