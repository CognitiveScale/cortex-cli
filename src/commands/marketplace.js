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
const yeoman = require('yeoman-environment');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Resource = require('../client/marketplace');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

const getNamespaceAndResourceName = (resourceName) => {
    if (_.isEmpty(resourceName)) { throw new SyntaxError(`Invalid name ${resourceName} must conform to namespace/version`); }

    if (resourceName.startsWith('/')) { throw new SyntaxError("Names cannot start with '/' "); }

    return resourceName.split('/');
};

module.exports.SaveResourceCommand = class SaveResourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    execute(resourceDefinition, executablePath, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeSaveResource(%s)', profile.name, resourceDefinition);

        const resourceDefStr = fs.readFileSync(resourceDefinition);
        const resourceObject = parseObject(resourceDefStr, options);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceObject.asset.name);

        const resource = new Resource(profile.url);
        resource.saveResource(this.resourceType, namespace, resourceName, profile.token, resourceObject, executablePath)
            .then((response) => {
                if (response.success) {
                    printSuccess(`${this.resourceType} saved`, options);
                } else {
                    printError(`Failed to save ${this.resourceType}: ${response.status} ${response.details || response.message}`);
                }
            })
            .catch((err) => {
                printError(`Failed to save ${this.resourceType}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ListResourceCommand = class ListResourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListResource(%s)', profile.name);
        const sortBy = options.sort || '';
        const offset = options.offset || 0;
        const limit = options.limit || 10;
        const privateOnly = options.private || false;

        const resource = new Resource(profile.url);
        resource.listResourcesByType(this.resourceType, profile.token, privateOnly, sortBy, offset, limit)
            .then((response) => {
                if (response.success) {
                    let result = filterObject(response, options) || [];

                    if (options.json) {
                        printSuccess(JSON.stringify(result, null, 2), options);
                    }
                    else {
                        const tableSpec = [
                            { column: 'Title', field: 'title', width: 50 },
                            { column: 'Name', field: 'name', width: 50 },
                            { column: 'Version', field: '_version', width: 12 }
                        ];

                        printTable(tableSpec, result.resources || result);
                    }
                } else {
                    printError(`Failed to list ${this.resourceType}: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to list ${this.resourceType}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeResourceCommand = class DescribeResourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    execute(resourceNameWithNamespace, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeResource(%s)', profile.name, resourceNameWithNamespace);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.describeResource(this.resourceType, namespace, resourceName, profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.resource, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe ${this.resourceType} ${resourceNameWithNamespace}: ${response.details || response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to describe ${this.resourceType} ${resourceNameWithNamespace}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeleteResourceCommand = class DeleteResourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    execute(resourceNameWithNamespace, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDeleteResource(%s)', profile.name, resourceNameWithNamespace);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.deleteResource(this.resourceType, namespace, resourceName, profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.status, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to delete ${this.resourceType} ${resourceNameWithNamespace}: ${response.status} ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to delete ${this.resourceType} ${resourceNameWithNamespace}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.SearchResourceCommand = class SearchResourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    execute(searchString, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeSearchResources(%s)', profile.name, searchString);
        const sortBy = options.sort || '';
        const offset = options.offset || 0;
        const limit = options.limit || 10;
        const privateOnly = options.private || false;

        const searchObject = {
            _searchString: searchString || '',
            _filter: {
                resourceType: this.resourceType,
            },
        };

        if (options.filter) {
            Object.assign(searchObject._filter, JSON.parse(options.filter));
        }

        const resource = new Resource(profile.url);
        resource.searchResources(this.resourceType, searchObject, profile.token, privateOnly, sortBy, offset, limit).then((response) => {
            if (response.success) {
                const result = filterObject(response, options) || [];

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Version', field: '_version', width: 12 }
                    ];

                    printTable(tableSpec, result.resources || result);
                }
            } else {
                printError(`Failed to search ${this.resourceType}: [status:${response.status}] ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to search ${this.resourceType}: [status:${err.status}] ${err.message}`, options);
            });
    }
};

module.exports.InstallResourceCommand = class InstallResourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    execute(resourceNameWithNamespace, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeSearchResources(%s)', profile.name, resourceNameWithNamespace);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.installResource(this.resourceType, namespace, resourceName, profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response, options) || [];

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Script', field: 'script', width: 40 },
                        { column: 'Output', field: 'output', width: 100 },
                        { column: 'code', field: 'code', width: 12 }
                    ];

                    printTable(tableSpec, result.scripts || result);
                }
            }
            else {
                printError(`Failed to install ${this.resourceType} ${resourceNameWithNamespace}: ${response.details || response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to install ${this.resourceType} ${resourceNameWithNamespace}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ExecuteResourceCommand = class ExecutesourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    validateInputParams(options) {
        if (!options.inputParams) {
            options.color = 'off';
            printError('error: option `--inputParams <inputParams>` argument missing', options);
        }
        try {
            JSON.parse(options.inputParams);
        } catch (err) {
            printError('inputParams should be a valid json');
        }
    }

    validateRoute(options) {
        if (!options.route) {
            options.color = 'off';
            printError('error: option `--route <route>` argument missing', options);
        }
    }

    execute(resourceNameWithNamespace, options) {
        this.validateInputParams(options);
        this.validateRoute(options);

        const profile = loadProfile(options.profile);
        debug('%s.executeSearchResources(%s)', profile.name, resourceNameWithNamespace);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.executeResource(this.resourceType, namespace, resourceName, profile.token, options.inputParams, options.route).then((response) => {
            if (response.success) {
                let result = filterObject(response.response, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to execute ${this.resourceType} ${resourceNameWithNamespace}: ${response.details || response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to execute ${this.resourceType} ${resourceNameWithNamespace}: ${err.status} ${err.message}`, options);
            });
    }
};
