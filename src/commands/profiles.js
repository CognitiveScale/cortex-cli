/*
 * Copyright 2019 Cognitive Scale, Inc. All Rights Reserved.
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

const _ = require('lodash');
const fs = require('fs');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const { Graph } = require('../client/graph');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

class SaveProfileSchemaCommand {

    constructor(program) {
        this.program = program;
    }

    execute(profileSchema, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeSaveProfileSchema(%s)', profile.name, profileSchema);

        const schemaStr = fs.readFileSync(profileSchema);
        const schema = parseObject(schemaStr, options);

        const catalog = new Catalog(profile.url);
        catalog.saveProfileSchema(profile.token, schema)
            .then((response) => {
                if (response.success) {
                    printSuccess(`Profile Schema saved`, options);
                } else {
                    const {message, details} = response;
                    debug(`Failed to save profile schema: ${response.status} - ${message}`);
                    debug(response);
                    printError('Failed to save profile schema.', options, false);
                    if (details) {
                        printError('The following issues were found:', options, false);
                        const tableSpec = [
                            {column: 'Path', field: 'path', width: 50},
                            {column: 'Message', field: 'message', width: 100},
                        ];
                        printTable(tableSpec, details);
                        printError(''); // Just exit
                    }
                }
            })
            .catch((err) => {
                printError(`Failed to save profile schema: ${err.status} ${err.response.body.error}`, options);
            });
    }
}

class ListProfileSchemasCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListProfileSchemas()', profile.name);
        
        const { filter, sort, limit, skip } = options;
        const catalog = new Catalog(profile.url);
        catalog.listProfileSchemas(profile.token, filter, sort, limit, skip)
            .then((response) => {
                if (response.success) {
                    let result = response.schemas;
                    if (options.query)
                        result = filterObject(result, options);

                    if (options.json) {
                        printSuccess(JSON.stringify(result, null, 2), options);
                    } else {
                        const tableSpec = [
                            {column: 'Title', field: 'title', width: 50},
                            {column: 'Name', field: 'name', width: 50},
                            {column: 'Version', field: '_version', width: 12}
                        ];

                        printTable(tableSpec, result);
                    }
                } else {
                    printError(`Failed to list profile schemas: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list profile schemas: ${err.status} ${err.message}`, options);
            });
    }
}

class DescribeProfileSchemaCommand {

    constructor(program) {
        this.program = program;
    }

    execute(schemaName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeProfileSchema(%s)', profile.name, schemaName);

        const catalog = new Catalog(profile.url);
        catalog.describeProfileSchema(profile.token, schemaName)
            .then((response) => {
                if (response.success) {
                    let result = filterObject(response.schema, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Failed to describe profile schema ${schemaName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to describe profile schema ${schemaName}: ${err.status} ${err.message}`, options);
            });
    }
}

class DeleteProfileSchemaCommand {

    constructor(program) {
        this.program = program;
    }

    execute(schemaName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDeleteProfileSchema(%s)', profile.name, schemaName);

        const catalog = new Catalog(profile.url);
        catalog.deleteProfileSchema(profile.token, schemaName)
            .then((response) => {
                if (response.success) {
                    debug(response.message);
                    printSuccess(`Profile Schema deleted.`, options);
                } else {
                    printError(`Failed to delete profile schema ${schemaName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to delete profile schema ${schemaName}: ${err.status} ${err.message}`, options);
            });
    }
}

class ListProfilesCommand {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListProfiles()', profile.name);

        const { filter, sort, limit, skip } = options;
        const graph = new Graph(profile.url);
        graph.listProfiles(profile.token, filter, sort, limit, skip)
            .then((response) => {
                if (response.success) {
                    let result = response.profiles;
                    if (options.query)
                        result = filterObject(result, options);

                    if (options.json) {
                        printSuccess(JSON.stringify(result, null, 2), options);
                    }
                    else {
                        const tableSpec = [
                            {column: 'Profile ID', field: 'profileId', width: 50},
                            {column: 'Profile Schema', field: 'profileSchema', width: 50},
                            {column: 'Version', field: 'version', width: 12},
                            {column: 'Last Updated', field: 'updatedAt', width: 40}
                        ];

                        printTable(tableSpec, result);
                    }
                }
                else {
                    printError(`Failed to list profiles: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list profiles: ${err.status} ${err.message}`, options);
            });
    }
}

class DescribeProfileCommand {
    constructor(program) {
        this.program = program;
    }

    execute(profileId, schemaName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeProfile(%s)', profile.name, profileId);

        const graph = new Graph(profile.url);
        graph.describeProfile(profile.token, profileId, schemaName)
            .then((response) => {
                if (response.success) {
                    let result = filterObject(response.profile, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Failed to describe profile ${schemaName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to describe profile ${schemaName}: ${err.status} ${err.message}`, options);
            });
    }
}

class DeleteProfileCommand {

    constructor(program) {
        this.program = program;
    }

    execute(profileId, schemaName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDeleteProfile(%s)', profile.name, profileId);

        const graph = new Graph(profile.url);
        graph.deleteProfile(profile.token, profileId, schemaName)
            .then((response) => {
                if (response.success) {
                    printSuccess(`Profile deleted.`, options);
                } else {
                    printError(`Failed to delete profile ${schemaName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to delete profile ${schemaName}: ${err.status} ${err.message}`, options);
            });
    }
}

class RebuildProfilesCommand {

    constructor(program) {
        this.program = program;
    }

    execute(schemaName, profileId, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeRebuildProfiles(%s)', profile.name, schemaName);

        const graph = new Graph(profile.url);
        graph.rebuildProfiles(profile.token, schemaName, profileId, options.filter, options.sort, options.limit, options.skip)
            .then((response) => {
                if (response.success) {
                    printSuccess(response.message, options);
                } else {
                    printError(`Failed to rebuild profile: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to rebuild profile: ${err.status} ${err.message}`, options);
            });
    }
}

module.exports = {
    SaveProfileSchemaCommand,
    ListProfileSchemasCommand,
    DescribeProfileSchemaCommand,
    DeleteProfileSchemaCommand,
    ListProfilesCommand,
    DescribeProfileCommand,
    DeleteProfileCommand,
    RebuildProfilesCommand,
};
