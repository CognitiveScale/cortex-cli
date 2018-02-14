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
    ListFunctionsCommand, 
    DescribeFunctionCommand, 
    DeleteFunctionCommand, 
    InvokeFunctionCommand,
    DeployFunctionCommand
} = require('../src/commands/functions');

program.description('Work with Cortex Functions');

// List Functions
program
    .command('list')
    .description('List the deployed functions')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action((options) => {
        try {
            new ListFunctionsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Describe Function
program
    .command('describe <functionName>')
    .description('Describe a function')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('-d, --download', 'Download code binary in response')
    .action((functionName, options) => {
        try {
            new DescribeFunctionCommand(program).execute(functionName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Delete Function - TODO
// program
//     .command('delete <functionId>')
//     .description('Delete a function')
//     .option('--color [on/off]', 'Turn on/off color output.', 'on')
//     .option('--profile [profile]', 'The profile to use')
//     .action((options) => {
//         try {
//             new DeleteFunctionCommand(program).execute(functionId, options);
//         }
//         catch (err) {
//             console.error(chalk.red(err.message));
//         }
//     });

// Invoke Function
program
    .command('invoke <functionId>')
    .description('Invoke a function')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((functionId, options) => {
        try {
            new InvokeFunctionCommand(program).execute(functionId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Deploy Action
program
    .command('deploy <functionName>')
    .description('Deploy a function')
    .option('--kind [kind]', 'Function runtime kind') // python:3, python:2, nodejs:default
    .option('--code [code]', 'The code file or code archive to deploy')
    .option('--docker [image]', 'Docker image to use as the runner')
    .option('--memory [memory]', 'Function memory limit in megabytes', '256')
    .option('--timeout [timeout]', 'Execution timeout in milliseconds', '60000')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((functionName, options) => {
        try {
            new DeployFunctionCommand(program).execute(functionName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);