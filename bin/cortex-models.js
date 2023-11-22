#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 DeleteModelCommand, SaveModelCommand, DescribeModelCommand, ListModelsCommand, UpdateModelStatusCommand, ListModelRunsCommand, 
} from '../src/commands/models.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, GET_DEFAULT_SORT_CLI_OPTION, DEFAULT_LIST_SORT_PARAMS, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT, 
} from '../src/constants.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();

    program.name('cortex models');
    program.description('Work with Cortex Models');
// List Models
    program
        .command('list')
        .description('List model definitions')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--tags <tags>', 'The tags to use (comma separated values)')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
        .action(withCompatibilityCheck((options) => {
            try {
                new ListModelsCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Describe Model
    program
        .command('describe <modelName>')
        .description('Describe model')
        .alias('get')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--verbose', 'Verbose output')
        .action(withCompatibilityCheck((modelName, options) => {
            try {
                checkForEmptyArgs([modelName]);
                new DescribeModelCommand(program).execute(modelName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Delete Model
    program
        .command('delete <modelName>')
        .description('Delete a model')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((modelName, options) => {
            try {
                checkForEmptyArgs([modelName]);
                new DeleteModelCommand(program).execute(modelName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Save Model
    program
        .command('save <modelDefinition>')
        .description('Save a model definition')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for model definition format')
        .action(withCompatibilityCheck((modelDefinition, options) => {
            try {
                new SaveModelCommand(program).execute(modelDefinition, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Publish a Model
    program
        .command('publish <modelName>')
        .description('Publish a model')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for model definition format')
        .option('--content-type <MIME type>', 'Sets the `Content-Type` or MIME type of the content ( default: application/octet-stream )')
        .action(withCompatibilityCheck((modelName, options) => {
            try {
                checkForEmptyArgs([modelName]);
                new UpdateModelStatusCommand(program).execute(modelName, options, 'publish');
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Unpublish a Model
    program
        .command('unpublish <modelName>')
        .description('Unpublish a model')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for model definition format')
        .option('--content-type <MIME type>', 'Sets the `Content-Type` or MIME type of the content ( default: application/octet-stream )')
        .action(withCompatibilityCheck((modelName, options) => {
            try {
                checkForEmptyArgs([modelName]);
                new UpdateModelStatusCommand(program).execute(modelName, options, 'unpublish');
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// List model runs
    program
        .command('list-runs <modelName>')
        .description('List model run')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS._updatedAt))
        .action(withCompatibilityCheck((modelName, options) => {
            try {
                checkForEmptyArgs([modelName]);
                new ListModelRunsCommand(program).execute(modelName, options);
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
