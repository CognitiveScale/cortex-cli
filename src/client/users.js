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
const { got } = require('./apiutils');
const { constructError, getUserAgent } = require('../commands/utils');

module.exports = class Users {
    constructor(cortexUrl, user, flags = []) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/fabric/v4`;
        this.flags = '';

        if (user) {
            this.usersEndpoint = `${this.endpoint}/usergrants/${user}`;
        } else {
            this.usersEndpoint = `${this.endpoint}/usergrants`;
        }
        this.usersProjectsEndpoint = `${this.usersEndpoint}/projects`;
        if (flags.length > 0) {
            this.flags = `${flags.reduce((flagString, flag) => {
                if (flagString) {
                    flagString += `&${flag}=true`;
                } else {
                    flagString += `?${flag}=true`;
                }
                return flagString;
            }, '')}`;
        }
    }

    createServiceUser(token, user) {
        const endpoint = `${this.endpoint}/accounts/service/${user}`;
        debug('createServiceUser => %s', endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    deleteServiceUser(token, user) {
        const endpoint = `${this.endpoint}/accounts/service/${user}`;
        debug('createServiceUser => %s', endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    listServiceUsers(token) {
        const endpoint = `${this.endpoint}/accounts/service`;
        debug('createServiceUser => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    describeUser(token) {
        const endpoint = `${this.usersEndpoint}/${this.flags}`;
        debug('describeUser => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    createGrantForUser(token, body) {
        const endpoint = this.usersEndpoint;
        debug('createGrantForUser => %s', endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: body,
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    removeGrantFromUser(token, body) {
        const endpoint = this.usersEndpoint;
        debug('removeGrantFromUser => %s', endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: body,
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    addUsersToProject(token, project, users) {
        const endpoint = `${this.usersProjectsEndpoint}`;
        debug('addUsersToProject => %s', endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: { project, users },
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    removeUsersFromProject(token, project, users) {
        const endpoint = `${this.usersProjectsEndpoint}`;
        debug('removeUsersFromProject => %s', endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: { project, users },
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }
};
