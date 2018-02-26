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
const Connections = require('../client/connections');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

module.exports.ListConnections = class ListConnections {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listConnections()', profile.name);

        const conns = new Connections(profile.url);
        conns.listConnections(profile.token).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    let result = filterObject(response.result.connections, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Title', field: 'title', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                        { column: 'Connection Type', field: 'connectionType', width: 50 },
                        { column: 'Created On', field: 'createdAt', width: 26 }
                    ];

                    printTable(tableSpec, response.result.connections);
                }
            }
            else {
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

   execute(connectionDefinition, options) {
       const profile = loadProfile(options.profile);
       debug('%s.executeSaveDefinition(%s)', profile.name, connectionDefinition);

       const connDefStr = fs.readFileSync(connectionDefinition);
       const connObj = parseObject(connDefStr, options);
       debug('%o', connObj);

       const connection = new Connections(profile.url);
       connection.saveConnection(profile.token, connObj).then((response) => {
           if (response.success) {
               printSuccess(`Connection saved`, options);
           }
           else {
               printError(`Failed to save connection: ${response.status} ${response.message}`, options);
           }
       })
       .catch((err) => {
           printError(`Failed to save connection: ${err.status} ${err.message}`, options);
       });
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
        connection.describeConnection(profile.token, connectionName).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
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

   execute(connectionDefinition, options) {
       const profile = loadProfile(options.profile);
       debug('%s.executeTestDefinition(%s)', profile.name, connectionDefinition);

       const connDefStr = fs.readFileSync(connectionDefinition);
       const connObj = parseObject(connDefStr, options);
       debug('%o', connObj);

       const connection = new Connections(profile.url);
       connection.testConnection(profile.token, connObj).then((response) => {
           if (response.success) {
               printSuccess(`Connection successfully tested`, options);
           }
           else {
               printError(`Failed while testing connection: ${response.status} ${response.message}`, options);
           }
       })
       .catch((err) => {
           printError(`Failed while testing connection: ${err.status} ${err.message}`, options);
       });
   }
};
