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
const {
    ListActionsCommand,
    DescribeActionCommand,
    DeleteActionCommand,
    InvokeActionCommand,
    DeployActionCommand
} = require('../src/commands/actions');

let processed = false;
program.description('Work with Cortex Actions');

// List Actions
program
    .command('list')
    .description('List the deployed actions')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action((options) => {
        try {
            new ListActionsCommand(program).execute(options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Describe Action
program
    .command('describe <functionName>')
    .description('Describe a function')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('-d, --download', 'Download code binary in response')
    .action((functionName, options) => {
        try {
            new DescribeActionCommand(program).execute(functionName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Delete Action - TODO
// program
//     .command('delete <functionId>')
//     .description('Delete a function')
//     .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
//     .option('--profile [profile]', 'The profile to use')
//     .action((options) => {
//         try {
//             new DeleteActionCommand(program).execute(functionId, options);
//         }
//         catch (err) {
//             console.error(chalk.red(err.message));
//         }
//     });

// Invoke Action
program
    .command('invoke <functionId>')
    .description('Invoke a function')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((functionId, options) => {
        try {
            new InvokeActionCommand(program).execute(functionId, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Deploy Action
program
    .command('deploy <functionName>')
    .description('Deploy a function')
    .option('--kind [kind]', 'Action runtime kind') // python:3, python:2, nodejs:default
    .option('--code [code]', 'The code file or code archive to deploy')
    .option('--docker [image]', 'Docker image to use as the runner')
    .option('--memory [memory]', 'Action memory limit in megabytes', '256')
    .option('--timeout [timeout]', 'Execution timeout in milliseconds', '60000')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((functionName, options) => {
        try {
            if (!options.kind && !options.docker) {
                throw new Error('--kind [kind] or --docker [image] required');
            }

            if (options.docker && options.kind) {
                throw new Error('Use either --kind [kind] or --docker [image], but not both');
            }

            new DeployActionCommand(program).execute(functionName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

process.env.DOC && require('../src/commands/utils').exportDoc(program);

program.parse(process.argv);
if (!processed)
    ['string', 'undefined'].includes(typeof program.args[0]) && program.help();