#!/usr/bin/env node

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

program.description('Work with the Cortex Processor Runtime');
    
// List Processor Runtime Types
program
    .command('list-runtime-types')
    .description('List available processor runtime types')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListRuntimeTypesCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Processor Runtimes
program
    .command('list-runtimes')
    .description('List configured processor runtimes')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListRuntimesCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Describe Processor Runtime
program
    .command('describe <runtimeName>')
    .description('Describe a processor runtime')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((runtimeName, options) => {
        try {
            new DescribeRuntimeCommand(program).execute(runtimeName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Delete Processor Runtime
program
    .command('delete <runtimeName>')
    .description('Delete a processor runtime')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .action((runtimeName, options) => {
        try {
            new DeleteRuntimeCommand(program).execute(runtimeName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Actions
program
    .command('list-actions <runtimeName>')
    .description('List the available processor runtime actions')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((runtimeName, options) => {
        try {
            new ListActionsCommand(program).execute(runtimeName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Invoke Action
program
    .command('invoke <runtimeName> <actionId>')
    .description('Invoke a processor action')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .action((runtimeName, actionId, options) => {
        try {
            new InvokeActionCommand(program).execute(runtimeName, actionId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);