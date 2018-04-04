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
    ListRuntimesCommand, 
    ListRuntimeTypesCommand, 
    ListActionsCommand, 
    DescribeRuntimeCommand, 
    DeleteRuntimeCommand, 
    InvokeActionCommand 
} = require('../src/commands/processors');

let processed = false;
program.description('Work with the Cortex Processor Runtime');
    
// List Processor Runtime Types
program
    .command('list-runtime-types')
    .description('List available processor runtime types')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListRuntimeTypesCommand(program).execute(options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Processor Runtimes
program
    .command('list-runtimes')
    .description('List configured processor runtimes')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListRuntimesCommand(program).execute(options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Describe Processor Runtime
program
    .command('describe <runtimeName>')
    .description('Describe a processor runtime')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((runtimeName, options) => {
        try {
            new DescribeRuntimeCommand(program).execute(runtimeName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Delete Processor Runtime
program
    .command('delete <runtimeName>')
    .description('Delete a processor runtime')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((runtimeName, options) => {
        try {
            new DeleteRuntimeCommand(program).execute(runtimeName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Actions
program
    .command('list-actions <runtimeName>')
    .description('List the available processor runtime actions')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((runtimeName, options) => {
        try {
            new ListActionsCommand(program).execute(runtimeName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Invoke Action
program
    .command('invoke <runtimeName> <actionId>')
    .description('Invoke a processor action')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .action((runtimeName, actionId, options) => {
        try {
            new InvokeActionCommand(program).execute(runtimeName, actionId, options);
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
