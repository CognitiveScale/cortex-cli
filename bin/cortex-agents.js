#!/usr/bin/env node

const program = require('commander');
const { SaveAgentCommand } = require('../src/commands/agents');

program.description('Work with Cortex Agents');
    
program
    .command('save <agentDefinition>')
    .description('Save an agent definition')
    .option('--color [on/off]', 'Turn on/off color output.', /^(on|off)$i/, 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('-y, --yaml', 'Use YAML for agent definition format')
    .action((agentDefinition, options) => new SaveAgentCommand(program).execute(agentDefinition, options));

program.parse(process.argv);