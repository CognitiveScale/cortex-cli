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

module.exports = class Roles {
    constructor(cortexUrl, role, flags = []) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/fabric/v4`;
        this.flags = '';

        if (role) {
            this.rolesEndpoint = `${this.endpoint}/roles/${role}`;
        } else {
            this.rolesEndpoint = `${this.endpoint}/roles`;
        }
        this.rolesUsersEndpoint = `${this.rolesEndpoint}/users`;
        this.rolesGrantsEndpoint = `${this.rolesEndpoint}/grants`;

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

    describeRole(token) {
        const endpoint = this.rolesEndpoint + this.flags;
        debug('describeRole => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }


    deleteRole(token) {
        const endpoint = this.rolesEndpoint;
        debug('deleteRole => %s', endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    createRole(token, body) {
        const endpoint = this.rolesEndpoint;
        debug('createRole => %s', endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: body,
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }


    addUsersToRole(token, users) {
        const endpoint = `${this.rolesUsersEndpoint}`;
        debug('addUsersToRole => %s', endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: { users },
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    removeUsersFromRole(token, users) {
        const endpoint = `${this.rolesUsersEndpoint}`;
        debug('removeUsersFromRole => %s', endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: { users },
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    createGrantForRole(token, body) {
        const endpoint = `${this.rolesGrantsEndpoint}`;
        debug('createGrantForRole => %s', endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: body,
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    removeGrantFromRole(token, body) {
        const endpoint = `${this.rolesGrantsEndpoint}`;
        debug('removeGrantFromRole => %s', endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: body,
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }

    listRoles(token, project) {
        let endpoint = this.rolesEndpoint;
        if (project) {
            endpoint += `?project=${project}`;
        }
        debug('listRoles => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(res => ({ success: true, result: res }))
            .catch(err => constructError(err));
    }
};
