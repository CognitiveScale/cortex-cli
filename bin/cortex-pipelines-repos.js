#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 ListPipelineRepoCommand, DescribePipelineRepoCommand, DeletePipelineRepoCommand, SavePipelineRepoCommand,
} from '../src/commands/pipelines.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SORT_PARAMS, GET_DEFAULT_SORT_CLI_OPTION, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';

export function create() {
  const program = new Command();
  program.name('cortex pipelines repos');
  program.description('Work with Cortex Pipeline Repositories');

// List
  program
    .command('list')
    .description('List Pipeline Repositories')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
    .action(withCompatibilityCheck((options) => {
      try {
        new ListPipelineRepoCommand(program).execute(options);
      } catch (err) {
        console.error(chalk.red(err.message));
      }
    }));

// Describe
  program
    .command('describe <pipelineRepoName>')
    .alias('get')
    .description('Describe a Pipeline Repository')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
    .action(withCompatibilityCheck((pipelineRepoName, options) => {
      try {
        new DescribePipelineRepoCommand(program).execute(pipelineRepoName, options);
      } catch (err) {
        console.error(chalk.red(err.message));
      }
    }));

// Delete
  program
    .command('delete <pipelineRepoName>')
    .description('Delete a Pipeline Repository')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck((actionName, options) => {
      try {
        new DeletePipelineRepoCommand(program).execute(actionName, options);
      } catch (err) {
        console.error(chalk.red(err.message));
      }
    }));

// Save
  program
    .command('save <pipelineRepoDefinition>')
    .description('Save a Pipeline Repository definition. Takes JSON file by default.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('-y, --yaml', 'Use YAML for Pipeline Repository definition format')
    // TODO: should this have CLI args for <repo> & <branch> ??
    .action(withCompatibilityCheck((pipelineRepoDefinition, options) => {
      try {
        new SavePipelineRepoCommand(program).execute(pipelineRepoDefinition, options);
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
