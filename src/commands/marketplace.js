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
const Resource = require('../client/marketplace');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

const getNamespaceAndResourceName = (resourceName) => {
    if (_.isEmpty(resourceName)) { throw new SyntaxError(`Invalid name ${resourceName} must conform to namespace/name:?version`); }

    if (resourceName.startsWith('/')) { throw new SyntaxError("Names cannot start with '/' "); }

    const parts = resourceName.split('/');
    if (!parts[1]) {
        throw new SyntaxError('Provide a name with namespace');
    }

    return parts;
};

module.exports.SaveResourceCommand = class SaveResourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    static getZipFilePath(options) {
        if (!options.zip) {
            printError('error: option `--zip <zip>` argument missing', options);
        }

        if (!fs.existsSync(options.zip)) {
            printError(`Zip file path ${options.zip} does not exist`, options);
        }
        return options.zip;
    }

    execute(resourceNameWithNamespace, resourceDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeSave%s(%s)', profile.name, _.upperFirst(this.resourceType), resourceDefinition);

        const resourceDefStr = fs.readFileSync(resourceDefinition);
        const resourceObject = parseObject(resourceDefStr, options);
        const zipFilePath = SaveResourceCommand.getZipFilePath(options);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.saveResource(this.resourceType, namespace, resourceName, profile.token, resourceObject, zipFilePath)
            .then((response) => {
                if (response.success) {
                    printSuccess(`${_.upperFirst(this.resourceType)} saved`, options);
                } else {
                    printError(`Failed to save ${this.resourceType}: ${response.status} ${JSON.stringify(response.details || response.message)}`);
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
        debug('%s.executeList%s()', profile.name, _.upperFirst(this.resourceType));
        const sortBy = options.sort || '';
        const offset = options.offset || 0;
        const limit = options.limit || 10;
        const privateOnly = !(options.all || false);

        const resource = new Resource(profile.url);
        resource.listResourcesByType(this.resourceType, profile.token, privateOnly, sortBy, offset, limit)
            .then((response) => {
                if (response.success) {
                    let result = filterObject(response.resources, options) || [];

                    if (options.json) {
                        printSuccess(JSON.stringify(result, null, 2), options);
                    }
                    else {
                        const tableSpec = [
                            { column: 'Title', field: 'title', width: 50 },
                            { column: 'Name', field: 'name', width: 50 },
                            { column: 'Version', field: '_version', width: 12 }
                        ];

                        printTable(tableSpec, result);
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
        debug('%s.executeDescribe%(%s)', profile.name, _.upperFirst(this.resourceType), resourceNameWithNamespace);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.describeResource(this.resourceType, namespace, resourceName, profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.resource, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe ${this.resourceType} ${resourceNameWithNamespace}: ${response.message}`, options);
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
        debug('%s.executeDelete%s(%s)', profile.name, _.upperFirst(this.resourceType), resourceNameWithNamespace);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.deleteResource(this.resourceType, namespace, resourceName, profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response, options);
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
        debug('%s.executeSearch%s(%s)', profile.name, _.upperFirst(this.resourceType), searchString);
        const sortBy = options.sort || '';
        const offset = options.offset || 0;
        const limit = options.limit || 10;
        const privateOnly = !(options.all || false);

        const searchObject = {
            _searchString: searchString || '',
            _filter: {
                resourceType: this.resourceType,
            },
        };

        if (options.filter) {
            try {
                const filterQuery = parseObject(options.filter, options);
                Object.assign(searchObject._filter, filterQuery);
            } catch (err) {
                debug('Error parsing filterQuery: %e', err.message);
                printError('filterQuery should be valid JSON string');
            }
        }

        const resource = new Resource(profile.url);
        resource.searchResources(this.resourceType, searchObject, profile.token, privateOnly, sortBy, offset, limit).then((response) => {
            if (response.success) {
                const result = filterObject(response.resources, options) || [];

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Version', field: '_version', width: 12 }
                    ];

                    printTable(tableSpec, result);
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
        debug('%s.executeSearch%s(%s)', profile.name, _.upperFirst(this.resourceType), resourceNameWithNamespace);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.installResource(this.resourceType, namespace, resourceName, profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.scripts, options) || [];
                printSuccess(JSON.stringify(result, null, 2), options);
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

module.exports.ExecuteResourceCommand = class ExecuteResourceCommand {

    constructor(program, resourceType) {
        this.program = program;
        this.resourceType = resourceType;
    }

    execute(resourceNameWithNamespace, options) {
        if (!options.route) {
            printError('error: option `--route <route>` argument missing', options);
        }
        const route = options.route;

        // Add input params into the payload field as per marketplace web
        let params = {
            payload: ""
        };
        if (options.params) {
            params.payload = parseObject(options.params, options);
        } else if (options.paramsFile) {
            const paramsStr = fs.readFileSync(options.paramsFile);
            params.payload = parseObject(paramsStr, options);
        } else {
            printError('--params [params] or --params-file [paramsFile] argument missing');
        }
        params = JSON.stringify(params);

        const profile = loadProfile(options.profile);
        debug('%s.executeSearch%s(%s)', profile.name, _.upperFirst(this.resourceType), resourceNameWithNamespace);

        const [ namespace, resourceName ] = getNamespaceAndResourceName(resourceNameWithNamespace);

        const resource = new Resource(profile.url);
        resource.executeResource(this.resourceType, namespace, resourceName, profile.token, params, route)
            .then((response) => {
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
