#!/usr/bin/env -S node --no-warnings
import chalk from 'chalk';
import { Command } from 'commander';
import esMain from 'es-main';

function create() {
    const program = new Command();

    program.name('cortex generate');
    program.description('Scaffolding Cortex Components [DEPRECATED]');
    program
        .command('skill [skillName] [type]')
        .description('Generates the structure and top level build script for a skill in current directory')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .action(() => {
            console.error(chalk.red('Generate command has been superceded by the Workspaces command.'));
        });
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
