import debugSetup from 'debug';
import { loadProfile } from '../config.js';
import Roles from '../client/roles.js';
import {
    printSuccess, printError, filterObject, EXTERNALROLESFORMAT, handleTable, getFilteredOutput, handleError,
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
export const RoleDeleteCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(role, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteRole(%s)', profile.name, role);
        const client = new Roles(profile.url, role);
        try {
            const response = await client.deleteRole(profile.token);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to delete role');
        }
    }
};
export const RoleCreateCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(role, options) {
        const profile = await loadProfile(options.profile);
        const form = createGrant(options);
        form.role = role;
        debug('%s.createRole(%s)', profile.name);
        const client = new Roles(profile.url);
        try {
            const response = await client.createRole(profile.token, form);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to create role');
        }
    }
};
export const RoleAssignCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(role, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.grantRole(%s)', profile.name, role);
        const client = new Roles(profile.url, role);
        const call = (deleteFlag, token, users) => {
            if (deleteFlag) {
                return client.removeUsersFromRole(token, users);
            }
            return client.addUsersToRole(token, users);
        };
        try {
        const response = await call(options.delete, profile.token, options.users);
        const result = filterObject(response.result, options);
        printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            const func = (options.delete) ? 'unassign' : 'assign';
            printError(`Failed to ${func} user from role : ${err.status} ${err.message}`, options);
        }
    }
};
export const RoleGrantCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(role, options) {
        const profile = await loadProfile(options.profile);
        const form = createGrant(options);
        debug('%s.grantRole(%s)', profile.name, role);
        const client = new Roles(profile.url, role);
        const call = (deleteFlag, token, body) => {
            if (deleteFlag) {
                return client.removeGrantFromRole(token, body);
            }
            return client.createGrantForRole(token, body);
        };
        try {
            const response = await call(options.delete, profile.token, form);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            const func = (options.delete) ? 'delete' : 'create';
            handleError(err, options, `Failed to ${func} grant for role`);
        }
    }
};
export const RoleDescribeCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(role, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.describeForRole(%s)', profile.name, role);
        const flags = [];
        if (options.grants) {
            flags.push('grants');
        }
        if (options.users) {
            flags.push('users');
        }
        const client = new Roles(profile.url, role, flags);
        try {
            const response = await client.describeRole(profile.token);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to describe role');
        }
    }
};
export const RoleListCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listRole(%s)', profile.name);
        const flags = [];
        const client = new Roles(profile.url, flags);
        try {
        const response = await client.listRoles(profile.token, options.project);
        const { result } = response;
        // TODO remove --query on deprecation
        if (options.json || options.query) {
            getFilteredOutput(result, options);
        } else {
            handleTable([{ column: 'Role', field: 'role' }], result.roles.map((x) => ({ role: x })), null, 'No roles found');
        }
        } catch (err) {
            handleError(err, options, 'Failed to list roles');
        }
    }
};
export const RoleProjectAssignCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(project, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.assignRoleProject(%s)', profile.name, project);
        const client = new Roles(profile.url, null);
        const call = (deleteFlag, token, assignProject, roles) => {
            if (deleteFlag) {
                return client.removeRolesFromProject(token, assignProject, roles);
            }
            return client.addRolesToProject(token, assignProject, roles);
        };
        try {
            const response = await call(options.delete, profile.token, project, options.roles);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            const func = (options.delete) ? 'unassign' : 'assign';
            handleError(err, options, `Failed to ${func} roles from project`);
        }
    }
};
export const ExternalGroupListCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listExternalGroup(%s)', profile.name);
        const client = new Roles(profile.url, null);
        try {
        const response = await client.listExternalGroups(profile.token);
        const { result } = response;
        // TODO remove --query on deprecation
        if (options.json || options.query) {
            getFilteredOutput(result, options);
        } else {
            handleTable(EXTERNALROLESFORMAT, result, (o) => ({ ...o, roles: o.roles.join(', ') }), null, 'No external roles found');
        }
        } catch (err) {
            handleError(err, options, 'Failed to list external groups');
        }
    }
};
export const ExternalGroupDescribeCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(externalGroup, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.describeExternalGroup(%s)', profile.name, externalGroup);
        const flags = [];
        if (options.roles) {
            flags.push('roles');
        }
        if (options.users) {
            flags.push('users');
        }
        const client = new Roles(profile.url, null, flags);
        try {
            const response = await client.describeExternalGroup(profile.token, externalGroup);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to describe external group');
        }
    }
};
export const ExternalGroupDeleteCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(externalGroup, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteExternalGroup(%s)', profile.name, externalGroup);
        const client = new Roles(profile.url, null);
        try {
            const response = await client.deleteExternalGroup(profile.token, externalGroup);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to delete external group');
        }
    }
};
export const ExternalGroupAssignCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.externalGroupAssign(%s)', profile.name, options.role);
        const client = new Roles(profile.url, options.role);
        const call = (deleteFlag, token, externalGroup) => {
            if (deleteFlag) {
                return client.removeExternalGroupFromRole(token, externalGroup);
            }
            return client.addExternalGroupToRole(token, externalGroup);
        };
        try {
            const response = await call(options.delete, profile.token, options.externalGroup);
            const result = filterObject(response.result, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            const func = (options.delete) ? 'unassign' : 'assign';
            handleError(err, options, `Failed to ${func} external group from role`);
        }
    }
};
