#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { SaveSkillCommand, ListSkillsCommand, DescribeSkillCommand } = require('../src/commands/skills');

program.description('Work with Cortex Skills');
    
// Save Skill
program
    .command('save <skillDefinition>')
    .description('Save a skill definition')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('-y, --yaml', 'Use YAML for skill definition format')
    .action((skillDefinition, options) => {
        try {
            new SaveSkillCommand(program).execute(skillDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Skills
program
    .command('list')
    .description('List skill definitions')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListSkillsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Describe Skill
program
    .command('describe <skillName>')
    .description('Describe skill')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((skillName, options) => {
        try {
            new DescribeSkillCommand(program).execute(skillName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);