#!/usr/bin/env node

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

const chalk = require('chalk');
const program = require('commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    CreateProjectCommand,
    ListProjectsCommand,
    DescribeProjectCommand,
    DeleteProjectCommand,
} = require('../src/commands/projects');
const { DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT } = require('../src/constants');

program.name('cortex projects');
program.description('Work with Cortex Projects');

// Create Project
program
    .command('save [projectDefinition]')
    .description('Save a project definition')
    .storeOptionsAsProperties(false)
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-n, --name <string>', 'The project name')
    .option('-t, --title [string]', 'The project title')
    .option('-d, --description [string]', 'The project description')
    .option('-y, --yaml', 'Use YAML for project definition format')
    .action(withCompatibilityCheck((projectDefinition, options) => {
        try {
            new CreateProjectCommand(program).execute(projectDefinition, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Projects
program
    .command('list')
    .description('List project definitions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--filter [filter]', 'A Mongo style filter to use.')
    .option('--limit [limit]', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip [skip]', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort [sort]', 'A Mongo style sort statement to use in the query.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListProjectsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get|Describe Project
program
    .command('describe <projectName>')
    .alias('get')
    .description('Describe project')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((projectName, options) => {
        try {
            new DescribeProjectCommand(program).execute(projectName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

    // Delete Project
program
    .command('delete <projectName>')
    .alias('d')
    .description('Delete project')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((projectName, options) => {
        try {
            new DeleteProjectCommand(program).execute(projectName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
