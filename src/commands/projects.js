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

function _formatpath(p) {
    let cnt = 0; let 
res = '';
    const len = p.length;
    p.forEach((s) => {
        if (_.isNumber(s)) {
            res += `[${s}]`;
        } else
            if (cnt < len) res += s;
            else res += s;
        if (cnt < len - 1 && !_.isNumber(p[cnt + 1])) res += '.';
        cnt += 1;
    });
    return res;
}

module.exports.CreateProjectCommand = class CreateProjectCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(projectDefinition, command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeSaveProject(%s)', profile.name, projectDefinition);
        let project = {};
        if (projectDefinition) {
            const projectDefStr = fs.readFileSync(projectDefinition);
            project = parseObject(projectDefStr, options);
        }
        if (_.isEmpty(options.name || project.name)) {
            printError('`name` must be provided', options);
        }
        try {
            const cli = new ApiServerClient(profile.url);
            const response = await cli.createProject(profile.token, {
                name: options.name || project.name,
                title: options.title || project.title,
                description: options.description || project.description,
            });
            if (response.name) {
                printSuccess(`Project ${response.name} saved`, options);
            } else if (response.details) {
                console.log(`Failed to save project: ${response.status} ${response.message}`);
                console.log('The following issues were found:');
                const tableSpec = [
                    { column: 'Path', field: 'path', width: 50 },
                    { column: 'Message', field: 'message', width: 100 },
                ];
                response.details.map(d => d.path = _formatpath(d.path));
                printTable(tableSpec, response.details);
                printError(''); // Just exit
            }
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
