#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const {
    GenerateProjectCommand
} = require('../src/commands/project');

program.description('Work with a related collection of Cortex contributions');

// Generate Project
program
    .command('generate')
    .description('Generates the structure and top level build script for a project')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .action((options) => {
        try {
            new GenerateProjectCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);
