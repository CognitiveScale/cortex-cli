#!/usr/bin/env node

const program = require('commander');

program
    .version('5.0.0alpha1')
    .description('Cortex CLI')
    .command('configure', 'Configure the Cortex CLI')
    .command('agents [cmd]', 'Work with Cortex Agents')
    .command('skills [cmd]', 'Work with Cortex Skills')
    .command('types [cmd]', 'Work with Cortex Types')
    .command('processors [cmd]', 'Work with the Cortex Processor Runtime')
    .command('functions [cmd]', 'Work with Cortex Functions');

program.parse(process.argv);