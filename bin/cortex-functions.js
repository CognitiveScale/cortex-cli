#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { 
    ListFunctionsCommand, 
    DescribeFunctionCommand, 
    DeleteFunctionCommand, 
    InvokeFunctionCommand,
    DeployFunctionCommand,
    LogsCommand
} = require('../src/commands/functions');

program.description('Work with Cortex Functions');

// List Functions
program
    .command('list')
    .description('List the deployed functions')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListFunctionsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Functions
program
    .command('describe <functionId>')
    .description('Describe a function')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListFunctionsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Functions
program
    .command('delete <functionId>')
    .description('Delete a function')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .action((options) => {
        try {
            new DeleteFunctionCommand(program).execute(functionId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Invoke Function
program
    .command('invoke <functionId>')
    .description('Invoke a function')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
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
    .command('deploy <functionId>')
    .description('Deploy a function')
    .option('--kind [kind]', 'Function runtime kind') // python:3, python:2, nodejs:default
    .option('--code [code]', 'The code file or code archive to deploy')
    .option('--docker [image]', 'Docker image to use as the runner')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .action((functionId, options) => {
        try {
            new DeployFunctionCommand(program).execute(functionId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Logs Action
program
    .command('logs <functionId>')
    .description('Get logs for a function')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .action((actionId, options) => {
        try {
            new LogsCommand(program).execute(functionId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);