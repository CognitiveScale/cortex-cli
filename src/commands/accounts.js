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

const fs = require('fs');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Accounts = require('../client/accounts');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

module.exports.CreateGroupCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(groupName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.createGroup', profile.name);

        const accounts = new Accounts(profile.url);
        const description = options.description;
        accounts.createGroup(profile.token, groupName, description).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to create group : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to create group : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.AddMembersToGroupCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(groupName, members, options) {
        const profile = loadProfile(options.profile);
        debug('%s.addMembersToGroup', profile.name);

        const accounts = new Accounts(profile.url);
        accounts.addMembersToGroup(profile.token, groupName, members).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to add members to group : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to add members to group : ${err.status} ${err.message}`, options);
            });
    }
};