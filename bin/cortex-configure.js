#!/usr/bin/env node

const program = require('commander');
const ConfigureCommand = require('../src/commands/configure');

program.description('Configure the Cortex CLI');

program
    .option('--profile [profile]', 'The profile to configure', 'default')
    .parse(process.argv);

new ConfigureCommand(program).execute({profile: program.profile});