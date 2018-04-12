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
        debug('%s.createGroup(%s)', profile.name, groupName);

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
        debug('%s.addMembersToGroup(%s)', profile.name, groupName);

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

module.exports.ListGroupsCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listGroups', profile.name);

        const accounts = new Accounts(profile.url);
        accounts.listGroups(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                if (options.json)
                    printSuccess(JSON.stringify(result, null, 2), options);
                else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Owner', field: 'owner', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                        { column: 'Tenant', field: 'tenant', width: 25 },
                        { column: 'Members', field: 'members', width: 30 },
                        { column: 'Upsert Date', field: 'upsert_date', width: 26 }
                    ];

                    printTable(tableSpec, result);
                }
            }
            else {
                printError(`Failed to list groups : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list groups : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeGroupCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(groupName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.describeGroup(%s)', profile.name, groupName);

        const accounts = new Accounts(profile.url);
        accounts.describeGroup(profile.token, groupName).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe group : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to describe group : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeleteGroupCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(groupName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.deleteGroup(%s)', profile.name, groupName);

        const accounts = new Accounts(profile.url);
        accounts.deleteGroup(profile.token, groupName).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to delete group : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to delete group : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RemoveMembersFromGroupCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(groupName, members, options) {
        const profile = loadProfile(options.profile);
        debug('%s.removeMembersFromGroup(%s)', profile.name, groupName);

        const accounts = new Accounts(profile.url);
        accounts.removeMembersFromGroup(profile.token, groupName, members).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to remove members from group : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to remove members from group : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.RegisterResourceCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(resourceName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.registerResource(%s)', profile.name, resourceName);

        const accounts = new Accounts(profile.url);
        const description = options.description;
        const access = options.access;
        accounts.registerResource(profile.token, resourceName, description, access).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to register resource : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to register resource : ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.GrantGroupAccessToResourceCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(resourceId, groupName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.grantGroupAccessToResource(resourceId: %s, groupName: %s)', profile.name, resourceId, groupName);

        const accounts = new Accounts(profile.url);
        accounts.grantGroupAccessToResource(profile.token, resourceId, groupName).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to grant group access to resource : ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to grant group access to resource : ${err.status} ${err.message}`, options);
            });
    }
};

// TODO: To be implemented
// module.exports.ListResourcesCommand = class {
//
//     constructor(program) {
//         this.program = program;
//     }
//
//     execute(options) {
//         const profile = loadProfile(options.profile);
//         debug('%s.listGroups', profile.name);
//
//         const accounts = new Accounts(profile.url);
//         accounts.listResources(profile.token).then((response) => {
//             if (response.success) {
//                 let result = filterObject(response.result, options);
//                 if (options.json)
//                     printSuccess(JSON.stringify(result, null, 2), options);
//                 else {
//                     const tableSpec = [
//                         { column: 'Name', field: 'name', width: 50 },
//                         { column: 'Owner', field: 'owner', width: 25 },
//                         { column: 'Description', field: 'description', width: 50 },
//                         { column: 'Tenant', field: 'tenant', width: 25 },
//                         { column: 'Members', field: 'members', width: 30 },
//                         { column: 'Upsert Date', field: 'upsert_date', width: 26 }
//                     ];
//
//                     printTable(tableSpec, result);
//                 }
//             }
//             else {
//                 printError(`Failed to add members to group : ${response.message}`, options);
//             }
//         })
//             .catch((err) => {
//                 printError(`Failed to add members to group : ${err.status} ${err.message}`, options);
//             });
//     }
// };

// TODO: To be implemented
// module.exports.UnregisterResourceCommand = class {
//
//     constructor(program) {
//         this.program = program;
//     }
//
//     execute(resourceName, options) {
//         const profile = loadProfile(options.profile);
//         debug('%s.deleteGroup(%s)', profile.name, resourceName);
//
//         const accounts = new Accounts(profile.url);
//         accounts.unregisterResource(profile.token, resourceName).then((response) => {
//             if (response.success) {
//                 let result = filterObject(response.result, options);
//                 printSuccess(JSON.stringify(result, null, 2), options);
//             }
//             else {
//                 printError(`Failed to delete group : ${response.message}`, options);
//             }
//         })
//             .catch((err) => {
//                 printError(`Failed to delete group : ${err.status} ${err.message}`, options);
//             });
//     }
// };

// TODO: To be implemented
// module.exports.RevokeGroupAccessToResourceCommand = class {
//
//     constructor(program) {
//         this.program = program;
//     }
//
//     execute(resourceId, options) {
//         const profile = loadProfile(options.profile);
//         debug('%s.revokeGroupAccessToResource(%s)', profile.name, resourceId);
//
//         const accounts = new Accounts(profile.url);
//         accounts.revokeGroupAccessToResource(profile.token, resourceId).then((response) => {
//             if (response.success) {
//                 let result = filterObject(response.result, options);
//                 printSuccess(JSON.stringify(result, null, 2), options);
//             }
//             else {
//                 printError(`Failed to delete group : ${response.message}`, options);
//             }
//         })
//             .catch((err) => {
//                 printError(`Failed to delete group : ${err.status} ${err.message}`, options);
//             });
//     }
// };