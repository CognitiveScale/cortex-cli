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
const ApiServerClient = require('../client/apiServerClient');
const {
 printSuccess, printError, filterObject, parseObject, printTable, 
} = require('./utils');

module.exports.CreateProjectCommand = class CreateProjectCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(projectDefinition, command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeSaveProject(%s)', profile.name, projectDefinition);
        let project = {};
        try {
            if (projectDefinition) {
                const projectDefStr = fs.readFileSync(projectDefinition);
                project = parseObject(projectDefStr, options);
            }
            if (_.isEmpty(options.name || project.name)) {
                printError('`name` must be provided', options);
            }
            const cli = new ApiServerClient(profile.url);
            const response = await cli.createProject(profile.token, {
                name: options.name || project.name,
                title: options.title || project.title,
                description: options.description || project.description,
            });
            printSuccess(`Project ${response.name} saved`, options);
        } catch (err) {
            printError(`Failed to save project: ${err.message}`, options);
        }
    }
};

module.exports.ListProjectsCommand = class ListProjectsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListProjects()', profile.name);

        const cli = new ApiServerClient(profile.url);
        try {
        const response = await cli.listProjects(profile.token);
            let result = response;
            if (options.query) result = filterObject(result, options);
            if (options.json) {
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                const tableSpec = [
                    { column: 'Name', field: 'name', width: 30 },
                    { column: 'Title', field: 'title', width: 50 },
                    { column: 'Description', field: 'description', width: 80 },
                ];
                printTable(tableSpec, result);
            }
        } catch (err) {
            printError(`Failed to list projects: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.DescribeProjectCommand = class DescribeProjectCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(projectName, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeProject(%s)', profile.name, projectName);
        const cli = new ApiServerClient(profile.url);

        try {
                const response = await cli.getProject(profile.token, projectName);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            printError(`Failed to describe project: ${err.status} ${err.message}`, options);
        }
    }
};
