import _ from 'lodash';
import fs from 'node:fs';
import debugSetup from 'debug';
import { loadProfile } from '../config.js';
import ApiServerClient from '../client/apiServerClient.js';
import {
 printSuccess, printError, parseObject, handleTable, printExtendedLogs, handleListFailure, getFilteredOutput, 
} from './utils.js';

const debug = debugSetup('cortex:cli');
export class CreateProjectCommand {
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
}
export class ListProjectsCommand {
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
            const result = response;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                printExtendedLogs(result, options);
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
}
export class DescribeProjectCommand {
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
            getFilteredOutput(response, options);
        } catch (err) {
            printError(`Failed to describe project: ${err.status} ${err.message}`, options);
        }
    }
}
export class DeleteProjectCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(projectName, command) {
        const options = command;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteProject(%s)', profile.name, projectName);
        try {
            const cli = new ApiServerClient(profile.url);
            const status = await cli.deleteProject(profile.token, projectName);
            if (status) {
                printSuccess(`Project ${projectName} deleted`, options);
            } else {
                printError(`Project ${projectName} does not exist.`, options);
            }
        } catch (err) {
            printError(`Failed to delete project: ${err.message}`, options);
        }
    }
}
