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

module.exports = class Variables {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = projectId => `${cortexUrl}/fabric/projects/${projectId}/secrets`;
    }

    listVariables(projectId, token) {
        const endpoint = `${this.endpoint(projectId)}?list=true`;
        debug('listVariables => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    readVariable(projectId, token, keyName) {
        const endpoint = `${this.endpoint(projectId)}/${keyName}`;
        debug('readVariable($s) => %s', keyName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    writeVariable(projectId, token, keyName, value) {
        const endpoint = `${this.endpoint(projectId)}/${keyName}`;
        debug('writeVariable(%s) => %s', keyName, endpoint);
        const body = { value };
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: body,
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }
};
