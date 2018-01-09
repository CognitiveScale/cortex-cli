#!/usr/bin/env node

const program = require('commander');

program
    .version('5.0.0')
    .description('Cortex CLI')
    .command('configure', 'Configure the Cortex CLI')
    .command('agents [cmd]', 'Work with Cortex Agents')
    .command('skills [cmd]', 'Work with Cortex Skills');

program.parse(process.argv);