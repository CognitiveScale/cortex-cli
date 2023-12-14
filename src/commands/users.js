import debugSetup from 'debug';
import { loadProfile } from '../config.js';
import Users from '../client/users.js';
import {
    printSuccess, printError, printWarning, filterObject, handleTable, getFilteredOutput, handleError,
} from './utils.js';
/*
 * Copyright 2023 Cognitive Scale, Inc. All Rights Reserved.
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
const debug = debugSetup('cortex:cli');
function createGrant(options) {
    return {
        project: options.project,
        resource: options.resource,
        actions: options.actions,
        effect: options.deny ? 'deny' : 'allow',
    };
}
export const UserGrantCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(user, options) {
        const profile = await loadProfile(options.profile);
        const form = createGrant(options);
        debug('%s.grantUser(%s)', profile.name, user || 'self');
        const client = new Users(profile.url, user);
        try {
            const call = (deleteFlag, token, body) => {
                if (deleteFlag) {
                    return client.removeGrantFromUser(token, body);
                }
                return client.createGrantForUser(token, body);
            };
            const response = await call(options.delete, profile.token, form);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            const func = (options.delete) ? 'delete' : 'create';
            handleError(err, options, `Failed to ${func} grant for user`);
        }
    }
};
export const UserDeleteCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(user, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteServiceUser(%s)', profile.name, user);
        const client = new Users(profile.url, user);
        try {
            const response = await client.deleteServiceUser(profile.token, user);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
                    handleError(err, options, 'Failed to delete user');
        }
    }
};
export const UserCreateCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(user, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.createServiceUser(%s)', profile.name, user);
        const client = new Users(profile.url, user);
        try {
            const response = await client.createServiceUser(profile.token, user);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result.config, null), options);
        } catch (err) {
            handleError(err, options, 'Failed to create user');
        }
    }
};
export const UserListCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listServiceUsers', profile.name);
        const client = new Users(profile.url, 'self');
        try {
            const response = await client.listServiceUsers(profile.token);
            const { result } = response;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                handleTable([{
                    column: 'User',
                    field: 'user',
                }], result.users.map((x) => ({ user: x })), null, 'No service users found');
            }
        } catch (err) {
            handleError(err, options, 'Failed to list service users');
        }
    }
};

export const UserDescribeCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(cliUser, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.describeForUser(%s)', profile.name, options.user || 'self');
        const flags = [];
        if (options.grants) {
            flags.push('grants');
        }
        if (options.roles) {
            flags.push('roles');
        }
        if (options?.user !== undefined && cliUser !== undefined) {
            printError('Bad options: --user <user> and <user> are mutually exclusive,', options);
        }
        const user = options?.user ?? cliUser;
        if (user === undefined) {
            printWarning('Defaulting to user from cortex profile', options);
        }
        const client = new Users(profile.url, user, flags);
        try {
            const response = await client.describeUser(profile.token);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to describe user');
        }
    }
};
export const UserProjectAssignCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(project, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.assignUserProject(%s)', profile.name, project);
        const client = new Users(profile.url, null);
        const call = (deleteFlag, token, assignProject, users) => {
            if (deleteFlag) {
                return client.removeUsersFromProject(token, assignProject, users);
            }
            return client.addUsersToProject(token, assignProject, users);
        };
        try {
            const response = await call(options.delete, profile.token, project, options.users);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            const func = (options.delete) ? 'unassign' : 'assign';
            handleError(err, options, `Failed to ${func} users from project`);
        }
    }
};
export const UserResetPATCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        const { user } = options;
        debug('%s.UserResetPATCommand(%s)', profile.name, user);
        const client = new Users(profile.url, 'self');
        try {
            const result = await client.resetUserPAT(profile.token, user);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to invalidate user PAT');
        }
    }
};
export const UserGetPATCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        const { user } = options;
        debug('%s.UserGetPATCommand(%s)', profile.name);
        const client = new Users(profile.url, 'self');
        try {
            const result = await client.getUserPAT(profile.token, user);
            printSuccess(JSON.stringify(result.config, null, 2), options);
        } catch (err) {
                handleError(err, options, 'Failed to fetch user PAT');
        }
    }
};
