#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { SaveTypeCommand, ListTypesCommand, DescribeTypeCommand } = require('../src/commands/types');

program.description('Work with Cortex Types');
    
// Save Type
program
    .command('save <typeDefinition>')
    .description('Save a type definition')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('-y, --yaml', 'Use YAML for type definition format')
    .action((typeDefinition, options) => {
        try {
            new SaveTypeCommand(program).execute(typeDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Types
program
    .command('list')
    .description('List type definitions')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListTypesCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Describe Type
program
    .command('describe <typeName>')
    .description('Describe type')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((typeName, options) => {
        try {
            new DescribeTypeCommand(program).execute(typeName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);