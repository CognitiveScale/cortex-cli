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
 printSuccess, printError, filterObject, parseObject, handleTable, printExtendedLogs, handleListFailure,
    getQueryOptions,
} = require('./utils');

module.exports.CreateProjectCommand = class CreateProjectCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(projectDefinition, command) {
        const options = command;
        const profile = await loadProfile(options.profile);
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

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListProjects()', profile.name);
        const cli = new ApiServerClient(profile.url);
        try {
            const sortParam = (options.sort || '{}').replace(/"/g, '\'');
            const filterParam = (options.filter || '{}').replace(/"/g, '\'');
            const response = await cli.listProjects(profile.token, filterParam, options.limit, options.skip, sortParam);
            let result = response;
            printExtendedLogs(result, options);
            const jsonVal = options.json;
            if (jsonVal) {
                if (jsonVal !== true) result = filterObject(result, { query: jsonVal });
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                const tableSpec = [
                    { column: 'Name', field: 'name', width: 30 },
                    { column: 'Title', field: 'title', width: 50 },
                    { column: 'Description', field: 'description', width: 80 },
                ];
                handleTable(tableSpec, result, null, 'No projects found');
            }
        } catch (err) {
            handleListFailure(_.get(err, 'response.errors[0]', err), options, 'Projects');
        }
    }
};

module.exports.DescribeProjectCommand = class DescribeProjectCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(projectName, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeProject(%s)', profile.name, projectName);
        const cli = new ApiServerClient(profile.url);

        try {
            const response = await cli.getProject(profile.token, projectName);
            const result = filterObject(response, getQueryOptions(options));
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            printError(`Failed to describe project: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.DeleteProjectCommand = class DeleteProjectCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(projectName, command) {
        const options = command;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteProject(%s)', profile.name, projectName);
        try {
            const cli = new ApiServerClient(profile.url);
            await cli.deleteProject(profile.token, projectName);
            printSuccess(`Project ${projectName} deleted`, options);
        } catch (err) {
            printError(`Failed to delete project: ${err.message}`, options);
        }
    }
};
