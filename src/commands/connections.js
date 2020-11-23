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
const { loadProfile } = require('../config');
const Connections = require('../client/connections');
const Content = require('../client/content');
const {
 printSuccess, printError, filterObject, parseObject, printTable, 
} = require('./utils');

module.exports.ListConnections = class ListConnections {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listConnections()', profile.name);

        const conns = new Connections(profile.url);
        conns.listConnections(options.project || profile.project, profile.token).then((response) => {
            if (response.success) {
                let result = response.result.connections;
                if (options.query) result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 40 },
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Description', field: 'description', width: 50 },
                        { column: 'Connection Type', field: 'connectionType', width: 25 },
                        { column: 'Writeable', field: 'allowWrite', width: 15 },
                        { column: 'Created On', field: 'createdAt', width: 26 },
                    ];

                    printTable(tableSpec, result);
                }
            } else {
                printError(`Failed to list connections: ${response.status} ${response.message}`, options);
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
       const results = _.get(connectionDefinition, 'params', []).filter(item => item.name === paramName);
       if (results && results.length) {
            return results[0].value;
       } 
            return undefined;
   }

   stripJarPathFromParams(params) {
       return params.filter(item => item.name !== 'jdbc_jar_file');
   }

   execute(connectionDefinition, options) {
       const profile = loadProfile(options.profile);
       debug('%s.executeSaveDefinition(%s)', profile.name, connectionDefinition);

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

    execute(connectionName, options) {
        const profile = loadProfile(options.profile);
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

module.exports.TestConnectionCommand = class TestConnectionCommand {
    constructor(program) {
        this.program = program;
    }

    getParamsValue(connectionDefinition, paramName) {
        const results = _.get(connectionDefinition, 'params', []).filter(item => item.name === paramName);
        if (results && results.length) {
             return results[0].value;
        } 
             return undefined;
    }

    stripJarPathFromParams(params) {
     return params.filter(item => item.name !== 'jdbc_jar_file');
    }

   execute(connectionDefinition, options) {
       const profile = loadProfile(options.profile);
       debug('%s.executeTestDefinition(%s)', profile.name, connectionDefinition);

       const connDefStr = fs.readFileSync(connectionDefinition);
       const connObj = parseObject(connDefStr, options);
       debug('%o', connObj);

       const jdbcJarFilePath = this.getParamsValue(connObj, 'jdbc_jar_file');
       const contentKey = this.getParamsValue(connObj, 'managed_content_key') || this.getParamsValue(connObj, 'plugin_jar');

       if (jdbcJarFilePath) {
           const content = new Content(profile.url);
           content.uploadContentStreaming(options.project || profile.project, profile.token, contentKey, jdbcJarFilePath)
               .then(() => {
               const connection = new Connections(profile.url);

               const marshaledConnObj = connObj;
               marshaledConnObj.params = this.stripJarPathFromParams(marshaledConnObj.params);

               connection.testConnection(options.project || profile.project, profile.token, marshaledConnObj).then((response) => {
                   if (response.success) {
                       printSuccess('Connection successfully tested', options);
                   } else {
                       printError(`Failed while testing connection: ${response.message}`, options);
                   }
               })
               .catch((err) => {
                   printError(`Failed while testing connection: ${err.response.body.message}`, options);
               });
           })
           .catch((err) => {
               printError(`Failed to upload jdbc jar: ${err.status} ${err.message}`, options);
           });
       } else {
           const connection = new Connections(profile.url);
           connection.testConnection(options.project || profile.project, profile.token, connObj).then((response) => {
               if (response.success) {
                   printSuccess('Connection successfully tested', options);
               } else {
                   printError(`Failed while testing connection: ${response.message || response.body.message}`, options);
               }
           })
           .catch((err) => {
               printError(`Failed while testing connection: ${err.status} ${err.message}`, options);
           });
       }
   }
};

module.exports.ListConnectionsTypes = class ListConnectionsTypes {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listConnectionsTypes()', profile.name);

        const conns = new Connections(profile.url);
        conns.listConnectionsTypes(profile.token).then((response) => {
            if (response.success) {
                let result = response.result.connectionTypes;
                if (options.query) result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Title', field: 'title', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                        { column: 'Created On', field: 'createdAt', width: 26 },
                        { column: 'Updated On', field: 'updatedAt', width: 26 },
                    ];

                    printTable(tableSpec, result);
                }
            } else {
                printError(`Failed to list connection types: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list connection types: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.QueryConnectionCommand = class QueryConnectionCommand {
    constructor(program) {
        this.program = program;
    }

    execute(connectionName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeQueryConnection(%s)', profile.name, connectionName);

        debug('params: %o', options);

        let queryObject = {};
        let queryInput = options.query;

        if (options.file) {
            queryInput = fs.readFileSync(options.file, 'UTF-8');
        }

        if (!queryInput) {
            queryInput = 'select 1';
        }

        try {
            queryObject = JSON.parse(queryInput);

            if (queryObject.filter) {
                queryObject.filter = JSON.stringify(queryObject.filter);
            }
            if (queryObject.sort) {
                queryObject.sort = JSON.stringify(queryObject.sort);
            }
        } catch (err) {
            queryObject.query = queryInput;
        }

        debug('queryParams: %o', queryObject);

        const connections = new Connections(profile.url);
        connections.queryConnection(options.project || profile.project, profile.token, connectionName, queryObject)
            .then((response) => {
                if (response.success) {
                    if (options.json) {
                        printSuccess(JSON.stringify(JSON.parse(response.message), null, 2), options);
                    } else {
                        // might get images/binaries from S3
                        printSuccess(response.message, options);
                    }
                } else {
                    printError(`Failed to query connection: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to query connection: ${err.status} ${err.message}`, options);
            });
    }
};
