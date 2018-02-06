#!/usr/bin/env node

const program = require('commander');
const { ConfigureCommand, ListConfigurationCommand } = require('../src/commands/configure');

program.description('Configure the Cortex CLI');

let cmd = undefined;

program
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to configure', 'default');

program
    .command('list')
    .action((options) => {
        cmd = 'list';
        new ListConfigurationCommand(program).execute({profile: program.profile});
    });

program.parse(process.argv);

if (cmd === undefined) {
    new ConfigureCommand(program).execute({profile: program.profile});
}