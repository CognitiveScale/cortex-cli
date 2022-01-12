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
    ListTasksCommand,
    DescribeTaskCommand,
    TaskLogsCommand,
    TaskDeleteCommand,
} = require('../src/commands/tasks');

program.name('cortex tasks');
program.description('Work with Cortex Tasks');

// List tasks
program
    .command('list')
    .description('List tasks')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    // .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    // .option('--agentName [string]', 'Query activations by agentName')
    // .option('--skillName [string]', 'Query activations by skillName')
    // .option('--startBefore [timestamp]', 'Filters activations to include those that started before the specified timestamp.')
    // .option('--startAfter [timestamp]', 'Filters activations to include those that started after the specified timestamp.')
    // .option('--endBefore [timestamp]', 'Filters activations to include those that ended before the specified timestamp.')
    // .option('--endAfter [timestamp]', 'Filters activations to include those that ended after the specified timestamp.')
    // .option('--correlationId [string]', 'Query activations with same correlationId')
    // .option('--status [status]', 'Filters activations by status [complete|error].')
    // .option('--limit [limit]', 'Limit number of records', '100')
    // .option('--offset [offset]', 'Skip number of records', '0')
    // .option('--sort [asc|desc]', 'Sort the activations by start timestamp ascending (asc) or descending (desc)')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListTasksCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('describe <taskName>')
    .alias('get')
    .description('Describe a task')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
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
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
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
    .command('delete <taskName>')
    .description('Delete a task, if it exists')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((taskName, options) => {
        try {
            new TaskDeleteCommand(program).execute(taskName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
