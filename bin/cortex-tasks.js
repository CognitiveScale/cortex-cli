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
    ListTasksCommand,
    DescribeTaskCommand,
    TaskLogsCommand,
    TaskDeleteCommand,
    TaskPauseCommand,
    TaskResumeCommand,
} = require('../src/commands/tasks');
const {
    DEFAULT_LIST_LIMIT_COUNT,
    DEFAULT_LIST_SKIP_COUNT,
} = require('../src/constants');

program.name('cortex tasks');
program.description('Work with Cortex Tasks');

// List tasks
program
    .command('list')
    .description('List tasks')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--actionName <string>', 'Filter tasks by action name')
    .option('--activationId <string>', 'filter tasks by activation id')
    .option('--skillName <string>', 'Filter tasks by skill name')
    .option('--scheduled', 'Show scheduled tasks only')
    .option('--json', 'Output results using JSON')
    // This is a client-side sort
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <asc|desc|sort>', 'Sort asc|desc on startTime or Mongo style sort statement.', 'asc')
    .action(withCompatibilityCheck(async (options) => {
        try {
            await new ListTasksCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('describe <taskName>')
    .alias('get')
    .description('Describe a task')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--k8s', 'Return the full k8sResource in the response')
    // .option('-o, --output <json|yaml|k8s>', 'Format output as yaml or k8s resources')
    .action(withCompatibilityCheck((taskName, options) => {
        try {
            new DescribeTaskCommand(program).execute(taskName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get task logs
program
    .command('logs <taskName>')
    .description('Get logs of a task')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    // TODO enable when we want to support tasks
    // .option('--type [type]', 'The type of action logs to fetch [skill|task]')
    .action(withCompatibilityCheck((taskName, options) => {
        try {
            new TaskLogsCommand(program).execute(taskName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete a task
program
    .command('delete <taskName...>')
    .description('Delete a task, if it exists')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck(async (taskName, options) => {
        try {
            await new TaskDeleteCommand(program).execute(taskName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Pause a task
program
    .command('pauseSchedule <taskNames...>')
    .description('Pause scheduling for a scheduled task')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck(async (taskName, options) => {
        try {
            await new TaskPauseCommand(program).execute(taskName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Resume a task
program
    .command('resumeSchedule <taskNames...>')
    .description('Resume paused schedule for a scheduled task')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck(async (taskName, options) => {
        try {
            await new TaskResumeCommand(program).execute(taskName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}

module.exports = program;
