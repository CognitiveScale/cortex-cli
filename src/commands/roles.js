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
const Roles = require('../client/roles');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

module.exports.RoleDeleteCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(role, options) {
        const profile = loadProfile(options.profile);
        debug('%s.deleteRole=%s', profile.name, role);

        const client = new Roles(profile.url, role);

        client.deleteRole(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to assign to user : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to assign to user : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleCreateCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(form, options) {
        const profile = loadProfile(options.profile);
        debug('%s.createRole=%s', profile.name);

        const client = new Roles(profile.url);

        client.createRole(profile.token, form).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to assign to user : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to assign to user : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleAssignCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(role, users, options) {
        const profile = loadProfile(options.profile);
        debug('%s.grantRoler=%s', profile.name, role);

        const client = new Roles(profile.url, role);
        const call = (deleteFlag, token, users) => {
            if(deleteFlag) {
                return client.removeUsersFromRole(token, users);
            } else {
                return client.addUsersToRole(token, users);
            }
        };

        call(options.delete, profile.token, users).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to assign to user : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to assign to user : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleGrantCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(role, form, options) {
        const profile = loadProfile(options.profile);
        debug('%s.grantRoler=%s', profile.name, role);

        const client = new Roles(profile.url, role);
        const call = (deleteFlag, token, form) => {
            if(deleteFlag) {
                return client.removeGrantFromRole(token, form);
            } else {
                return client.createGrantForRole(token, form);
            }
        };

        call(options.delete, profile.token, form).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to assign to user : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to assign to user : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleDescribeCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(role, options) {
        const profile = loadProfile(options.profile);
        debug('%s.describeForRole=%s', profile.name, role);

        const flags = [];

        if(options.grants) {
            flags.push('grants');
        }
        if(options.users) {
            flags.push('users');
        }
        const client = new Roles(profile.url, role, flags);
        client.describeRole(profile.token).then((response) => {
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

module.exports.RoleListCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listRole=%s', profile.name);

        const flags = [];

        const client = new Roles(profile.url, flags);
        client.describeRole(profile.token).then((response) => {
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
