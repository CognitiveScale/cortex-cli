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

const chalk = require('chalk');
const program = require('../src/commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    ListActionsCommand,
    DescribeActionCommand,
    DeleteActionCommand,
    InvokeActionCommand,
    DeployActionCommand,
    TaskLogsActionCommand,
    TaskCancelActionCommand,
    TaskStatusActionCommand,
    JobTaskListActionCommand,
    TaskStatsActionCommand,
} = require('../src/commands/actions');

program.description('Work with Cortex Actions');

// List Actions
program
    .command('list')
    .description('List the deployed actions')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListActionsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Action
program
    .command('describe <actionName>')
    .description('Describe an action')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('-d, --download', 'Download code binary in response')
    .action(withCompatibilityCheck((actionName, options) => {
        try {
            new DescribeActionCommand(program).execute(actionName, options);
        }
        catch (err) {
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
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--actionType [actionType]', 'Type of action')
    .action(withCompatibilityCheck((actionName, options) => {
        try {
            new DeleteActionCommand(program).execute(actionName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Invoke Action
program
    .command('invoke <actionName>')
    .description('Invoke an action')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--memory [memory]', 'Action memory limit in megabytes')
    .option('--vcpus [vcpus]', 'Action vcpus limit in integer')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--actionType [actionType]', 'Type of action')
    .option('--path [path]', 'Path to the daemon service url being invoked', '')
    .option('--method [method]', 'HTTP method')                                         // GET, POST ...
    .action(withCompatibilityCheck((actionName, options) => {
        try {
            new InvokeActionCommand(program).execute(actionName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Deploy Action
program
    .command('deploy <actionName>')
    .description('Deploy an action')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--kind [kind]', 'Action runtime kind') // python:3, python:2, nodejs:default
    .option('--code [code]', 'The code file or code archive to deploy')
    .option('--docker [image]', 'Docker image to use as the runner')
    .option('--memory [memory]', 'Action memory limit in megabytes')
    .option('--vcpus [vcpus]', 'Action vcpus limit in integer')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--actionType [actionType]', 'Type of action')
    .option('--port [port]', 'Docker port')                  //'9091'
    .option('--environment [environment]', 'Environment')
    .option('--cmd [cmd]', 'Command to be executed')    //'["--daemon"]'
    .option('--environmentVariables [environmentVariables]', 'Docker container environment variables, only used for daemon action types')
    .option('--push-docker', 'Push Docker image to the Cortex registry.')    
    .action(withCompatibilityCheck((actionName, options) => {
        try {
            if (!options.kind && !options.docker) {
                throw new Error('--kind [kind] or --docker [image] required');
            }
            // allow kind with docker for blackbox images..
            // if (options.docker && options.kind) {
            //     throw new Error('Use either --kind [kind] or --docker [image], but not both');
            // }

            new DeployActionCommand(program).execute(actionName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get Tasks logs
program
    .command('task-logs <jobId> <taskId>')
    .description('Get Tasks logs')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((jobId, taskId, options) => {
        try {
            new TaskLogsActionCommand(program).execute(jobId, taskId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Cancel Tasks
program
    .command('task-cancel <jobId> <taskId>')
    .description('Cancel Task')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((jobId, taskId, options) => {
        try {
            new TaskCancelActionCommand(program).execute(jobId, taskId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get Tasks Status
program
    .command('task-status <jobId> <taskId>')
    .description('Get Task\'s status')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((jobId, taskId, options) => {
        try {
            new TaskStatusActionCommand(program).execute(jobId, taskId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Job tasks
program
    .command('task-list <jobId>')
    .description('List Job\'s tasks status')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.' +
        ' Example to query for status [PENDING, SUBMITTED, STARTING, RUNNING, SUCCEEDED, FAILED] tasks: --query "data[?status == \'FAILED\'].taskId"')
    .action(withCompatibilityCheck((jobId, options) => {
        try {
            new JobTaskListActionCommand(program).execute(jobId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get Job Stats
program
    .command('task-stats <jobId>')
    .description('Get Task\'s stats for a given Job')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((jobId, options) => {
        try {
            new TaskStatsActionCommand(program).execute(jobId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
