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
} = require('../src/commands/tasks');

program.name('cortex tasks');
program.description('Work with Cortex Tasks');

// List activations
program
    .command('list')
    .description('List tasks')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    // .option('--json', 'Output results using JSON')
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
    .option('-o, --output <json|yaml|k8s>', 'Format output as yaml or k8s resources')
    .action(withCompatibilityCheck((taskName, options) => {
        try {
            new DescribeTaskCommand(program).execute(taskName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;