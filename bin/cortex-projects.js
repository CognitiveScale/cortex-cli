#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import process from 'node:process';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 CreateProjectCommand, ListProjectsCommand, DescribeProjectCommand, DeleteProjectCommand, 
} from '../src/commands/projects.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, GET_DEFAULT_SORT_CLI_OPTION, DEFAULT_LIST_SORT_PARAMS, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT, 
} from '../src/constants.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();

    program.name('cortex projects');
    program.description('Work with Cortex Projects');
// Create Project
    program
        .command('save [projectDefinition]')
        .description('Save a project definition')
        .storeOptionsAsProperties(false)
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('-n, --name <string>', 'The project name')
        .option('-t, --title <string>', 'The project title')
        .option('-d, --description <string>', 'The project description')
        .option('-y, --yaml', 'Use YAML for project definition format')
        .action(withCompatibilityCheck((projectDefinition, options) => {
            try {
                return new CreateProjectCommand(program).execute(projectDefinition, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
// List Projects
    program
        .command('list')
        .description('List project definitions')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS._updatedAt))
        .action(withCompatibilityCheck((options) => {
            try {
                return new ListProjectsCommand(program).execute(options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
// Get|Describe Project
    program
        .command('describe <projectName>')
        .alias('get')
        .description('Describe project')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck((projectName, options) => {
            try {
                checkForEmptyArgs([projectName]);
                return new DescribeProjectCommand(program).execute(projectName, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
// Delete Project
    program
        .command('delete <projectName>')
        .alias('d')
        .description('Delete project')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(withCompatibilityCheck((projectName, options) => {
            try {
                checkForEmptyArgs([projectName]);
                return new DeleteProjectCommand(program).execute(projectName, options);
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
