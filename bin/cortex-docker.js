#!/usr/bin/env -S node --no-warnings
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import DockerLoginCommand from '../src/commands/docker.js';

export function create() {
    const program = new Command();
    program.name('cortex docker');
    program.description('Work with Docker');
// Login
    program
        .command('login')
        .description('Docker login to the Cortex registry with your jwt token')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--ttl <time>', 'The amount of time for this login to remain active, expressed as a number of hours, days, or weeks (e.g. 1h, 2d, 2w)', '14d')
        .action(withCompatibilityCheck((options) => {
            try {
                new DockerLoginCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
