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

module.exports = class Roles {

    constructor(cortexUrl, role, flags = []) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/fabric/v4`;
        this.flags = '';

        if(role) {
            this.rolesEndpoint = `${this.endpoint}/roles/${role}`;
        } else {
            this.rolesEndpoint = `${this.endpoint}/roles`;
        }
        if(flags.length > 0) {
            this.flags = `${flags.reduce((flagString, flag) => {
                if (flagString) {
                    flagString += `&${flag}=true`
                } else {
                    flagString += `?${flag}=true`
                }
                return flagString;
            }, '')}`
        }
    }

    describeRole(token) {
        let endpoint = this.rolesEndpoint+this.flags;
        debug('describeRole => %s', endpoint);
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


    deleteRole(token) {
        const endpoint = this.rolesEndpoint;
        debug('deleteRole => %s', endpoint);
        return request
            .delete(endpoint)
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

    createRole(token, body) {
        const endpoint = this.rolesEndpoint;
        debug('createRole => %s', endpoint);
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


    addUsersToRole(token, users) {
        const endpoint = `${this.rolesEndpoint}/users`;
        debug('addUsersToRole => %s', endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send({users})
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

    removeUsersFromRole(token, users) {
        const endpoint = `${this.rolesEndpoint}/users`;
        debug('removeUsersFromRole => %s', endpoint);
        return request
            .delete(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send({users})
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

    createGrantForRole(token, body) {
        const endpoint = `${this.rolesEndpoint}/grants`;
        debug('createGrantForRole => %s', endpoint);
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

    removeGrantFromRole(token, body) {
        const endpoint = `${this.rolesEndpoint}/grants`;
        debug('removeGrantFromRole => %s', endpoint);
        return request
            .delete(endpoint)
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
