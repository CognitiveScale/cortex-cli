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
    ListActionsCommand,
    DescribeActionCommand,
    DeleteActionCommand,
    DeployActionCommand,
    // TODO re-add logs/task calls
    // GetLogsCommand,
    // JobTaskListActionCommand,
    // TaskCancelActionCommand,
    // TaskLogsActionCommand,
    // TaskStatsActionCommand,
    // TaskStatusActionCommand,
} = require('../src/commands/actions');

program.name('cortex actions');
program.description('Work with Cortex Actions');

// List Actions
program
    .command('list')
    .description('List the deployed actions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .option('--skip [skip]', 'Move the result cursor to this position before returning results.')
    .option('--limit [limit]', 'Limit the number of rows returned')
    .option('--filter [filter]', 'A Mongo style filter to use.')
    .option('--sort [sort]', 'A Mongo style sort statement to use in the query.')
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
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
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
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((actionName, options) => {
        try {
            new DeleteActionCommand(program).execute(actionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// // Get logs Action
// program
//     .command('logs <actionName>')
//     .description('Get logs for an action')
//     .option('--no-compat', 'Ignore API compatibility checks')
//     .option('--json', 'Return raw JSON response')
//     .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
//     .option('--profile [profile]', 'The profile to use')
//     .option('--project [project]', 'The project to use')
//     .action(withCompatibilityCheck((actionName, options) => {
//         try {
//             new GetLogsCommand(program).execute(actionName, options);
//         } catch (err) {
//             console.error(chalk.red(err.message));
//         }
//     }));

// Deploy Action
program
    .command('deploy [actionDefinition]')
    .alias('save')
    .description('Deploy an action')
    .storeOptionsAsProperties(false)
    .option('--name, --actionName [name]', 'Action name')
    .option('--type, --actionType [job/daemon]', 'Type of action')
    .option('--cmd [cmd]', 'Command to be executed') // '["--daemon"]'
    .option('--image, --docker [image]', 'Docker image to use as the runner')
    .option('--environmentVariables [environmentVariables]', 'Docker container environment variables, only used for daemon action types')
    .option('--jobTimeout [jobTimeout]', 'Job Timeout in seconds until the job is marked as FAILED (default: no timeout), only used for job action types')
    .option('-k, --k8sResource [file...]', 'Additional kubernetes resources deployed and owned by the skill, provide as last option specified or end list of files with "--"')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--podspec [podspec]', 'A file containing either a JSON or YAML formatted pod spec to merge with the action definition, used for specifying resources (like memory, ephemeral storage, CPUs, and GPUs) and tolerations (like allowing pods to be scheduled on tainted nodes).')
    .option('--port [port]', 'Docker port, only used for daemon action types') // '9091'
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--scaleCount [count]', 'Scale count, only used for daemon action types')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--push-docker', 'Push Docker image to the Cortex registry.')
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
