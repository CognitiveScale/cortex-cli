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
const yeoman = require('yeoman-environment');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Environments = require('../client/environments');
const Content = require('../client/content');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');
const _ = require('lodash/object');
module.exports.ListEnvironments = class ListEnvironments {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listEnvironment()', profile.name);

        const envs = new Environments(profile.url);
        envs.listEnvironments(profile.token).then((response) => {
            if (response.success) {
                let result = _.get(response,'result.environments',[]);
                if (options.query)
                    result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Name', field: 'name', width: 25 },
                        { column: 'Label', field: 'label', width: 25 },
                        { column: 'Type', field: 'type', width: 15 },
                        { column: 'Console Url', field: 'consoleUrl', width: 50 },
                        { column: 'White List', field: 'whiteList', width: 50 },
                        { column: 'Black List', field: 'blackList', width: 50 },
                    ];
                    printTable(tableSpec, result);
                }
            }
            else {
                printError(`Failed to list environments: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list environments: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.SaveEnvironmentCommand = class SaveEnvironmentCommand {

    constructor(program) {
        this.program = program;
    }

   execute(environmentDefinition, options) {
       const profile = loadProfile(options.profile);
       debug('%s.executeSaveDefinition(%s)', profile.name, environmentDefinition);

       const envDefStr = fs.readFileSync(environmentDefinition);
       const envObj = parseObject(envDefStr, options);
       debug('%o', envObj);

       const environment = new Environments(profile.url);
       environment.saveEnvironment(profile.token, envObj)
           .then((response) => {
               if (response.success) {
                       printSuccess(`Environment \'${envObj.name}\' saved`, options);
               } else {
                       printError(`Failed to save environment: ${response.status} ${response.message}`, options);
               }})
           .catch((err) => {
               printError(`Failed to save environment: ${err.response.body.message}`, options);
           });
   }
};


module.exports.DescribeEnvironmentCommand = class DescribeEnvironmentCommand {

    constructor(program) {
        this.program = program;
    }

    execute(environmentName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeEnvironment(%s)', profile.name, environmentName);

        const environment = new Environments(profile.url);
        environment.describeEnvironment(profile.token, environmentName).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe environment ${environmentName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe environment ${environmentName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListInstancesCommand = class ListInstancesCommand {

    constructor(program) {
        this.program = program;
    }

    execute(environmentName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListInstances(%s)', profile.name, environmentName);
        const environment = new Environments(profile.url);

        environment.listInstances(profile.token, environmentName).then((response) => {
            if (response.success) {
                let result = _.get(response,'result.instances',[]);
                if (options.query)
                    result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Instance Id', field: 'id', width: 26 },
                        { column: 'Status', field: 'status', width: 15 },
                        { column: 'Snapshot Id', field: 'snapshotId', width: 26 },
                        { column: 'Agent Name', field: 'agentName', width: 50 },
                        { column: 'Agent Version', field: 'agentVersion', width: 15 },
                        { column: 'Environment', field: 'environmentName', width: 26 },
                        { column: 'Created At', field: 'createdAt', width: 26 },
                    ];
                    printTable(tableSpec, result);
                }
            }
            else {
                printError(`Failed to list instances in environment ${environmentName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list instances in environment ${environmentName}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.PromoteEnvironmentCommand = class PromoteEnvironmentCommand {

    constructor(program) {
        this.program = program;
    }

    execute(promoteDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executePromoteDefinition(%s)', profile.name, promoteDefinition);
        let promObj;
        if ( promoteDefinition ) {
            const promStr = fs.readFileSync(promoteDefinition);
            promObj = parseObject(promStr, options);
        } else if ( _.get(options,'snapshotId','').length > 0 && _.get(options,'environmentName','').length > 0)  {
            promObj = { snapshotId: options.snapshotId, environmentName: options.environmentName }
        } else {
            printError(`Either --snapshotId <..> and --environmentName <..> or a promotion definition file must be provided`, options);
            return;
        }
        debug('%o', promObj);

        const environment = new Environments(profile.url);
        environment.promoteEnvironment(profile.token, promObj)
            .then((response) => {
                if (response.success) {
                    printSuccess(`Snapshot: \'${promObj.snapshotId}\' successfully promoted to environment:\'${promObj.environmentName}\'`, options);
                } else {
                    printError(`Failed to promote to environment: ${response.status} ${response.message}`, options);
                }})
            .catch((err) => {
                printError(`Failed to promote to environment: ${err.response.body.message}`, options);
            });
    }
};

