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
const _ = require('lodash');
const fs = require('fs');
const debug = require('debug')('cortex:cli');
const moment = require('moment');
const { loadProfile } = require('../config');
const Connections = require('../client/connections');
const Content = require('../client/content');

const {
 printSuccess, printError, filterObject, parseObject, printTable, DEPENDENCYTABLEFORMAT, CONNECTIONTABLEFORMAT, fileExists,
    handleTable,
    printExtendedLogs,
    handleListFailure,
} = require('./utils');

module.exports.ListConnections = class ListConnections {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listConnections()', profile.name);

        const conns = new Connections(profile.url);
        // eslint-disable-next-line consistent-return
        conns.listConnections(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                let result = response.result.connections;

                printExtendedLogs(result, options);
                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    handleTable(
                        CONNECTIONTABLEFORMAT,
                        result,
                        (o) => ({ ...o, createdAt: o.createdAt ? moment(o.createdAt).fromNow() : '-' }),
                        'No connections found',
                    );
                }
            } else {
                return handleListFailure(response, options, 'Connections');
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list connections: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.SaveConnectionCommand = class SaveConnectionCommand {
    constructor(program) {
        this.program = program;
    }

   getParamsValue(connectionDefinition, paramName) {
       const results = _.filter(_.get(connectionDefinition, 'params', []), (item) => item.name === paramName);
       if (results && results.length) {
            return results[0].value;
       } 
            return undefined;
   }

   stripJarPathFromParams(params) {
       return params.filter((item) => item.name !== 'jdbc_jar_file');
   }

   async execute(connectionDefinition, options) {
       const profile = await loadProfile(options.profile);
       debug('%s.executeSaveDefinition(%s)', profile.name, connectionDefinition);
        if (!fileExists(connectionDefinition)) {
            printError(`File does not exist at: ${connectionDefinition}`);
        }
       const connDefStr = fs.readFileSync(connectionDefinition);
       const connObj = parseObject(connDefStr, options);
       debug('%o', connObj);

       const jdbcJarFilePath = this.getParamsValue(connObj, 'jdbc_jar_file');
       const contentKey = this.getParamsValue(connObj, 'managed_content_key') || this.getParamsValue(connObj, 'plugin_jar');

       if (jdbcJarFilePath && !jdbcJarFilePath.includes('--Insert jar file path--')) {
           const content = new Content(profile.url);
           const connection = new Connections(profile.url);

           content.uploadContentStreaming(options.project || profile.project, profile.token, contentKey, jdbcJarFilePath)
           .then(() => {
               const marshaledConnObj = connObj;
               marshaledConnObj.params = this.stripJarPathFromParams(marshaledConnObj.params);

               connection.saveConnection(options.project || profile.project, profile.token, marshaledConnObj).then((response) => {
                   if (response.success) {
                       printSuccess('Connection saved', options);
                   } else {
                       printError(`Failed to save connection: ${response.status} ${response.message}`, options);
                   }
               })
               .catch((err) => {
                   printError(`Failed to save connection: ${err.response.body.message}`, options);
               });
           })
           .catch((err) => {
               printError(`Failed to upload jdbc jar: ${err.status} ${err.message}`, options);
           });
       } else {
           const connection = new Connections(profile.url);
           connection.saveConnection(options.project || profile.project, profile.token, connObj).then((response) => {
               if (response.success) {
                   printSuccess('Connection saved', options);
               } else {
                   printError(`Failed to save connection: ${response.status} ${response.message}`, options);
               }
           })
           .catch((err) => {
               printError(`Failed to save connection: ${err.response.body.message}`, options);
           });
       }
   }
};

module.exports.DescribeConnectionCommand = class DescribeConnectionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(connectionName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeConnection(%s)', profile.name, connectionName);

        const connection = new Connections(profile.url);
        connection.describeConnection(options.project || profile.project, profile.token, connectionName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to describe connection ${connectionName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe connection ${connectionName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DeleteConnectionCommand = class DeleteConnectionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(connectionName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteConnection(%s)', profile.name, connectionName);

        const connection = new Connections(profile.url);
        connection.deleteConnection(options.project || profile.project, profile.token, connectionName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            if (response.status === 403) { // has dependencies
                const tableFormat = DEPENDENCYTABLEFORMAT;
                printError(`Connection deletion failed: ${response.message}.`, options, false);
                return printTable(tableFormat, response.details);
            }
            return printError(`Failed to delete connection ${connectionName}: ${response.message}`, options);
        })
        .catch((err) => {
            printError(`Failed to delete connection ${connectionName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListConnectionsTypes = class ListConnectionsTypes {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listConnectionsTypes()', profile.name);

        const conns = new Connections(profile.url);
        // eslint-disable-next-line consistent-return
        conns.listConnectionsTypes(profile.token, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                let result = response.result.connectionTypes;

                printExtendedLogs(result, options);
                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Title', field: 'title', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                        { column: 'Created On', field: 'createdAt', width: 26 },
                        { column: 'Updated On', field: 'updatedAt', width: 26 },
                    ];
                    handleTable(tableSpec, result, null, 'No connection types found');
                }
            } else {
                return handleListFailure(response, options, 'Connection-types');
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list connection types: ${err.status} ${err.message}`, options);
        });
    }
};
