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
const _ = require("lodash")
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Users = require('../client/users');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

function createGrant(options) {
    return {
        project: options.project,
        resource: options.resource,
        actions: options.actions
    };
}

module.exports.UserGrantCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(user, options) {
        const profile = loadProfile(options.profile);
        const form = createGrant(options);
        debug('%s.grantUser=%s', profile.name, user || 'self');
        const client = new Users(profile.url, user);
        const call = (deleteFlag, token, form) => {
            if(deleteFlag) {
                return client.removeGrantFromUser(token, form);
            } else {
                return client.createGrantForUser(token, form);
            }
        };

        call(options.delete, profile.token, form).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                const func = (deleteFlag) ? 'delete' : 'create';
                printError(`Failed to ${func} grant for user : ${response.message}`, options);
            }
        })
            .catch((err) => {
                const func = (deleteFlag) ? 'delete' : 'create';
                printError(`Failed to ${func} grant for user : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.UserDescribeCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.describeForUser=%s', profile.name, options.user || 'self');

        const flags = [];

        if(options.grants) {
            flags.push('grants');
        }
        if(options.roles) {
            flags.push('roles');
        }
        const client = new Users(profile.url, options.user, flags);
        client.describeUser(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe user : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to describe user : ${err.status} ${err.message}`, options);
            });
    }
};
