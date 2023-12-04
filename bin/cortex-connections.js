#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SORT_PARAMS, GET_DEFAULT_SORT_CLI_OPTION, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT, 
} from '../src/constants.js';
import {
 ListConnections, SaveConnectionCommand, DescribeConnectionCommand, ListConnectionsTypes, DeleteConnectionCommand, 
} from '../src/commands/connections.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.name('cortex connections');
    program.description('Work with Cortex Connections');
// List Connections
    program
        .command('list')
        .description('List connections definitions')
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
        .action(withCompatibilityCheck((options) => {
            try {
                new ListConnections(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Save Connections
    program
        .command('save <connectionDefinition>')
        .description('Save a connections definition. Takes JSON file by default.')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for agent definition format')
        .action(withCompatibilityCheck((connDefinition, options) => {
            try {
                new SaveConnectionCommand(program).execute(connDefinition, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Describe Connection
    program
        .command('describe <connectionName>')
        .alias('get')
        .description('Describe connection')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck((connectionName, options) => {
            try {
                checkForEmptyArgs({ connectionName });
                new DescribeConnectionCommand(program).execute(connectionName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// List Connections Types
    program
        .command('list-types')
        .description('List connections types')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.')
        .action(withCompatibilityCheck((options) => {
            try {
                new ListConnectionsTypes(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Delete Connection
    program
        .command('delete <connectionName>')
        .description('Delete a connection')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((connectionName, options) => {
            try {
                checkForEmptyArgs({ connectionName });
                new DeleteConnectionCommand(program).execute(connectionName, options);
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
