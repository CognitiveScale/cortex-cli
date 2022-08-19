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
const { program } = require('commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    ListActionsCommand,
    DescribeActionCommand,
    DeleteActionCommand,
    DeployActionCommand,
} = require('../src/commands/actions');
const {
    DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SORT_PARAMS,
    GET_DEFAULT_SORT_CLI_OPTION,
} = require('../src/constants');

program.name('cortex actions');
program.description('Work with Cortex Actions');

// List Actions
program
    .command('list')
    .description('List the deployed actions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--query, --json [searchQuery]', 'Output results in JSON, supports JMESPath query to filter the response data')
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
    .action(withCompatibilityCheck((options) => {
        try {
            new ListActionsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Action
program
    .command('describe <actionName>')
    .alias('get')
    .description('Describe an action')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json [searchPath]', 'A JMESPath query to use in filtering the response data.')
    .option('--query <query>', '[DEPRECATION WARNING] A JMESPath query to use in filtering the response data.')
    .option('-d, --download', 'Download code binary in response')
    .action(withCompatibilityCheck((actionName, options) => {
        try {
            new DescribeActionCommand(program).execute(actionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Action
program
    .command('delete <actionName>')
    .description('Delete an action')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck((actionName, options) => {
        try {
            new DeleteActionCommand(program).execute(actionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Deploy Action
program
    .command('deploy [actionDefinition]')
    .alias('save')
    .description('Deploy an action')
    .storeOptionsAsProperties(false)
    .option('--name, --actionName <name>', 'Action name')
    .option('--type, --actionType <job|daemon>', 'Type of action')
    .option('--cmd <cmd>', 'Command to be executed') // '<"--daemon">'
    .option('--image, --docker <name[:tag]>', 'Docker image to use as the runner')
    .option('--environmentVariables <environmentVariables>', 'Docker container environment variables, only used for daemon action types')
    .option('--jobTimeout <jobTimeout>', 'Job Timeout in seconds until the job is marked as FAILED (default: no timeout), only used for job action types')
    .option('-k, --k8sResource <file...>', 'Additional kubernetes resources deployed and owned by the skill, provide as last option specified or end list of files with "--"')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--podspec <podspec>', 'A file containing either a JSON or YAML formatted pod spec to merge with the action definition, used for specifying resources (like memory, ephemeral storage, CPUs, and GPUs) and tolerations (like allowing pods to be scheduled on tainted nodes).')
    .option('--port <port>', 'Docker port, only used for daemon action types') // '9091'
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--scaleCount <count>', 'Scale count, only used for daemon action types')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    // TODO this command is non-functional, comment for now to avoid confusion
    // .option('--push-docker', 'Push Docker image to the Cortex registry.')
    .option('-y, --yaml', 'Use YAML format')
    .action(withCompatibilityCheck((actionName, options) => {
        try {
            new DeployActionCommand(program).execute(actionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
