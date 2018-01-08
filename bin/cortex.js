#!/usr/bin/env node

const program = require('commander');

program
    .version('5.0.0')
    .description('Cortex CLI')
    // .option('--debug [on/off/auto]', 'Turn on debug logging', /^(on|off|auto)$/i, 'auto')
    // .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    // .option('--color [on/off]', 'Turn on/off color output.', /^(on|off)$i/, 'on')
    // .option('--cortex-url [endpoint]', 'Overrides the default Cortex URL.', 'https://api.cortex.insights.ai');
    .command('configure', 'Configure the Cortex CLI')
    .command('agents [cmd]', 'Work with Cortex Agents');

program.parse(process.argv);