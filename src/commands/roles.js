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
const { loadProfile } = require('../config');
const Roles = require('../client/roles');
const {
 printSuccess, printError, filterObject, EXTERNALROLESFORMAT, handleTable,
} = require('./utils');

function createGrant(options) {
    return {
        project: options.project,
        resource: options.resource,
        actions: options.actions,
        effect: options.deny ? 'deny' : 'allow',
    };
}

module.exports.RoleDeleteCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(role, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteRole(%s)', profile.name, role);

        const client = new Roles(profile.url, role);

        client.deleteRole(profile.token).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to delete role : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to delete role : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleCreateCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(role, options) {
        const profile = await loadProfile(options.profile);
        const form = createGrant(options);
        form.role = role;
        debug('%s.createRole(%s)', profile.name);

        const client = new Roles(profile.url);

        client.createRole(profile.token, form).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to create role : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to create role : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleAssignCommand = class {
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

        call(options.delete, profile.token, options.users).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                const func = (options.delete) ? 'unassign' : 'assign';
                printError(`Failed to ${func} user from role : ${response.message}`, options);
            }
        })
            .catch((err) => {
                const func = (options.delete) ? 'unassign' : 'assign';
                printError(`Failed to ${func} user from role : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleGrantCommand = class {
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

        call(options.delete, profile.token, form).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                const func = (options.delete) ? 'delete' : 'create';
                printError(`Failed to ${func} grant for role : ${response.message}`, options);
            }
        })
            .catch((err) => {
                const func = (options.delete) ? 'delete' : 'create';
                printError(`Failed to ${func} grant for role : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleDescribeCommand = class {
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
        client.describeRole(profile.token).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to describe role : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to describe role : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleListCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listRole(%s)', profile.name);

        const flags = [];

        const client = new Roles(profile.url, flags);
        client.listRoles(profile.token, options.project).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    handleTable([{ column: 'Role', field: 'role' }], result.roles.map((x) => ({ role: x })), null, 'No roles found');
                }
            } else {
                printError(`Failed to list roles : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list roles : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RoleProjectAssignCommand = class {
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

        call(options.delete, profile.token, project, options.roles).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                const func = (options.delete) ? 'unassign' : 'assign';
                printError(`Failed to ${func} roles from project : ${response.message}`, options);
            }
        })
            .catch((err) => {
                const func = (options.delete) ? 'unassign' : 'assign';
                printError(`Failed to ${func} roles from project : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ExternalGroupListCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listExternalGroup(%s)', profile.name);

        const client = new Roles(profile.url, null);
        client.listExternalGroups(profile.token).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    handleTable(EXTERNALROLESFORMAT, result, (o) => ({ ...o, roles: o.roles.join(', ') }), null, 'No external roles found');
                }
            } else {
                printError(`Failed to list external groups : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list external groups : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ExternalGroupDescribeCommand = class {
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
        client.describeExternalGroup(profile.token, externalGroup).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to describe external group : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to describe external group : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ExternalGroupDeleteCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(externalGroup, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteExternalGroup(%s)', profile.name, externalGroup);

        const client = new Roles(profile.url, null);

        client.deleteExternalGroup(profile.token, externalGroup).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to delete external group : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to delete external group : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ExternalGroupAssignCommand = class {
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

        call(options.delete, profile.token, options.externalGroup).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                const func = (options.delete) ? 'unassign' : 'assign';
                printError(`Failed to ${func} external group from role : ${response.message}`, options);
            }
        })
            .catch((err) => {
                const func = (options.delete) ? 'unassign' : 'assign';
                printError(
                    `Failed to ${func} external group from role : ${err.status} ${err.message}`, options,
                );
            });
    }
};
