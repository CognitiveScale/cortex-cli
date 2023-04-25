#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import process from 'node:process';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 ListSecretsCommand, ReadSecretsCommand, WriteSecretsCommand, DeleteSecretCommand, 
} from '../src/commands/secrets.js';
import { LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT } from '../src/constants.js';

export function create() {
    const program = new Command();

    program.name('cortex secrets');
    program.description('Work with Cortex Secrets');
// List Secure Keys
    program
        .command('list')
        .description('List secure keys')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((options) => {
            try {
                return new ListSecretsCommand(program).execute(options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
// Read Secure Value
    program
        .command('describe <keyName>')
        .alias('get')
        .description('Retrieve the value stored for the given key.')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--json', 'Output results using JSON')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((keyName, options) => {
            try {
                return new ReadSecretsCommand(program).execute(keyName, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
// Write Secure Value
    program
        .command('save <keyName> [value]')
        .description('Save or overwrite a secure value. By default values are stored as strings but can also be saved as JSON or YAML.')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--data <data>', 'JSON value to save')
        .option('--data-file <dataFile>', 'A file containing either JSON or YAML formatted value to save')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((keyName, value, options) => {
            try {
                return new WriteSecretsCommand(program).execute(keyName, value, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
// Delete Secret
    program
        .command('delete <keyName>')
        .description('Delete a secret')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((keyName, options) => {
            try {
                return new DeleteSecretCommand(program).execute(keyName, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
