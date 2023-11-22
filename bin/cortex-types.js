#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import process from 'node:process';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, GET_DEFAULT_SORT_CLI_OPTION, DEFAULT_LIST_SORT_PARAMS, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT, 
} from '../src/constants.js';
import {
 SaveTypeCommand, ListTypesCommand, DescribeTypeCommand, DeleteTypeCommand, 
} from '../src/commands/types.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.name('cortex types');
    program.description('Work with Cortex Types');
// Save Type
    program
        .command('save <typeDefinition>')
        .description('Save a type definition')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for type definition format')
        .action(withCompatibilityCheck(async (typeDefinition, options) => {
            try {
                await new SaveTypeCommand(program).execute(typeDefinition, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// List Types
    program
        .command('list')
        .description('List type definitions')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
        .action(withCompatibilityCheck(async (options) => {
            try {
                await new ListTypesCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Describe Type
    program
        .command('describe <typeName>')
        .alias('get')
        .description('Describe type')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck(async (typeName, options) => {
            try {
                checkForEmptyArgs([typeName]);
                await new DescribeTypeCommand(program).execute(typeName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('delete <typeName>')
        .description('Delete a type')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--json', 'Output results using JSON')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (typeName, options) => {
            try {
                checkForEmptyArgs([typeName]);
                await new DeleteTypeCommand(program).execute(typeName, options);
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
