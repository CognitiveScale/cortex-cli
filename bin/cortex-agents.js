#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { SaveAgentCommand, ListAgentsCommand, DescribeAgentCommand } = require('../src/commands/agents');

program.description('Work with Cortex Agents');
    
// Save Agent
program
    .command('save <agentDefinition>')
    .description('Save an agent definition')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('-y, --yaml', 'Use YAML for agent definition format')
    .action((agentDefinition, options) => {
        try {
            new SaveAgentCommand(program).execute(agentDefinition, options);
        }
        catch (e) {
            console.error(chalk.red(err.message));
        }
    });

// List Agents
program
    .command('list')
    .description('List agent definitions')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((options) => {
        try {
            new ListAgentsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Agents
program
    .command('describe <agentName>')
    .description('Describe agent')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((agentName, options) => {
        try {
            new DescribeAgentCommand(program).execute(agentName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);