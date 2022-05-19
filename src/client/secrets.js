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
const urljoin = require('url-join');
const { got, defaultHeaders } = require('./apiutils');
const { constructError, checkProject } = require('../commands/utils');

module.exports = class Secrets {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = (projectId) => urljoin(cortexUrl, 'fabric/v4/projects', projectId, 'secrets');
    }

    listSecrets(projectId, token) {
        checkProject(projectId);
        const endpoint = urljoin(this.endpoint(projectId), '?list=true');
        debug('listSecrets => %s', endpoint);
        return got
            .get(endpoint, {
                headers: defaultHeaders(token),
            }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    readSecret(projectId, token, keyName) {
        checkProject(projectId);
        const endpoint = urljoin(this.endpoint(projectId), keyName);
        debug('readSecret(%s) => %s', keyName, endpoint);
        return got
            .get(endpoint, {
                headers: defaultHeaders(token),
            }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    deleteSecret(projectId, token, keyName) {
        checkProject(projectId);
        const endpoint = urljoin(this.endpoint(projectId), keyName);
        debug('deleteSecret(%s) => %s', keyName, endpoint);
        return got
            .delete(endpoint, {
                headers: defaultHeaders(token),
            }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    writeSecret(projectId, token, keyName, value) {
        checkProject(projectId);
        const endpoint = urljoin(this.endpoint(projectId), keyName);
        debug('writeSecret(%s) => %s', keyName, endpoint);
        const body = { value };
        return got
            .post(endpoint, {
                headers: defaultHeaders(token),
                json: body,
            }).json()
            .then((result) => ({ ...result }))
            .catch((err) => constructError(err));
    }
};
