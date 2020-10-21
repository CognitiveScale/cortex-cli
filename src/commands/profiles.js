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
const { printSuccess, printError, filterObject, parseObject, printTable, formatValidationPath } = require('./utils');

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
        catalog.saveProfileSchema(options.project || profile.project, profile.token, schema)
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
                        details.map(d => d.path = formatValidationPath(d.path));
                        printTable(tableSpec, details);
                        printError(''); // Just exit
                    }
                }
            })
            .catch((err) => {
                let msg = '';
                if (err.response && err.response.body) {
                    msg = err.response.body.error || '';
                }

                printError(`Failed to save profile schema: ${err.status || err} ${msg}`, options);
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
        catalog.listProfileSchemas(options.project || profile.project, profile.token, filter, sort, limit, skip)
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
        catalog.describeProfileSchema(options.project || profile.project, profile.token, schemaName)
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
        catalog.deleteProfileSchema(options.project || profile.project, profile.token, schemaName)
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
        graph.listProfiles(options.project || profile.project, profile.token, filter, sort, limit, skip)
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


class ListProfileVersionsCommand {
    constructor(program) {
        this.program = program;
    }

    execute(profileId, schemaName, options) {
        const profile = loadProfile(options.profile);
        const { before, after, limit } = options;
        debug(
            '%s.executeListProfileVersionsCommand(%s) Options:[%s][%s][%s]', 
            profile.name, profileId, before, after, limit
        );
        const graph = new Graph(profile.url);
        graph.listProfileVersions(options.project || profile.project, profile.token, profileId, schemaName, before, after, limit)
            .then((response) => {
                if (response.success) {
                    let result = response.versions;
                    if (options.query) {
                        result = filterObject(result, options);
                    }
                    if (options.json) {
                        printSuccess(JSON.stringify(result, null, 2), options);
                    }
                    else {
                        const tableSpec = [
                            { column: 'Profile ID', field: 'profileId', width: 50 },
                            { column: 'Profile Schema', field: 'profileSchema', width: 50 },
                            { column: 'Version', field: 'version', width: 12 },
                            { column: 'Created At', field: 'createdAt', width: 40 }
                        ];

                        printTable(tableSpec, result);
                    }
                }
                else {
                    printError(`Failed to list profile versions: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list profile versions: ${err.status} ${err.message}`, options);
            });
    }
}

class DescribeProfileCommand {
    constructor(program) {
        this.program = program;
    }

    execute(profileId, schemaName, options) {
        const profile = loadProfile(options.profile);
        const { historic, versionLimit, attribute } = options;
        debug(`${profile.name}.executeDescribeProfile(${profileId}) [${historic}][${versionLimit}][${attribute}]`);

        const graph = new Graph(profile.url);
        graph.describeProfile(options.project || profile.project, profile.token, profileId, schemaName, historic, versionLimit, attribute)
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
        graph.deleteProfile(options.project || profile.project, profile.token, profileId, schemaName)
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
        graph.rebuildProfiles(options.project || profile.project, profile.token, schemaName, profileId, options.filter, options.sort, options.limit, options.skip)
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
    ListProfileVersionsCommand,
    ListProfileSchemasCommand,
    DescribeProfileSchemaCommand,
    DeleteProfileSchemaCommand,
    ListProfilesCommand,
    DescribeProfileCommand,
    DeleteProfileCommand,
    RebuildProfilesCommand,
};
