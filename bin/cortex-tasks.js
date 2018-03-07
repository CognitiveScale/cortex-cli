#!/usr/bin/env node

/*
* Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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

const program = require('commander');
const chalk = require('chalk');
const { ListTasks, TaskLogs, CancelTask, DescribeTask, TaskStatus } = require('../src/commands/tasks');

program.description('Work with Cortex Jobs');


// List Tasks
program
    .command('list <jobDefinition>')
    .description('List connections definitions')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action((jobDefinition, options) => {
        try {
            new ListTasks(program).execute(jobDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Get Tasks logs
program
    .command('logs <jobDefinition> <taskDefinition>')
    .description('Get Tasks logs')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action((jobDefinition, taskDefinition, options) => {
        try {
            new TaskLogs(program).execute(jobDefinition, taskDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Cancel task
program
    .command('cancel <jobDefinition> <taskDefinition>')
    .description('Cancel a task')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('-m, --message <message>', 'Cancellation message')
    .action((jobDefinition, taskDefinition, options) => {
        try {
            new CancelTask(program).execute(jobDefinition, taskDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Describe task
program
    .command('describe <jobDefinition> <taskDefinition>')
    .description('Describe a task definition')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action((jobDefinition, taskDefinition, options) => {
        try {
            new DescribeTask(program).execute(jobDefinition, taskDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Get Task Status
program
    .command('status')
    .description('Get task status')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action((options) => {
        try {
            new TaskStatus(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });
program.parse(process.argv);
