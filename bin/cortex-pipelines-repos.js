#!/usr/bin/env node
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
  ListPipelineRepoCommand,
  DescribePipelineRepoCommand,
  DeletePipelineRepoCommand,
  SavePipelineRepoCommand,
  UpdateRepoPipelinesCommand,
} from '../src/commands/pipelineRepositories.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SORT_PARAMS, GET_DEFAULT_SORT_CLI_OPTION, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';
import { printError } from '../src/commands/utils.js';

export function create() {
  const repos = new Command();
  repos.name('cortex pipelines repos');
  repos.description('Work with Cortex Pipeline Repositories');

  // List
  repos
    .command('list')
    .description('List Pipeline Repositories')
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
        return new ListPipelineRepoCommand(repos).execute(options);
      } catch (err) {
        return printError(err.message);
      }
    }));

  // Describe
  repos
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
        return new DescribePipelineRepoCommand(repos).execute(pipelineRepoName, options);
      } catch (err) {
        return printError(err.message);
      }
    }));

  // Delete
  repos
    .command('delete <pipelineRepoName>')
    .description('Delete a Pipeline Repository')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck((actionName, options) => {
      try {
        return new DeletePipelineRepoCommand(repos).execute(actionName, options);
      } catch (err) {
        return printError(err.message);
      }
    }));

   // Save
  repos
    .command('save <pipelineRepoDefinition>')
    .description('Save a Pipeline Repository definition. Takes JSON file by default.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--skip-connection-check', 'Skip connection check to Pipeline Repository prior to saving Pipeline Repository.')
    .option('-y, --yaml', 'Use YAML for Pipeline Repository definition format')
    .action(withCompatibilityCheck((pipelineRepoDefinition, options) => {
      try {
        return new SavePipelineRepoCommand(repos).execute(pipelineRepoDefinition, options);
      } catch (err) {
        return printError(err.message);
      }
    }));

    // Update pipelines
    repos
    .command('update-pipelines <pipelineRepoName>')
    .description('Updates pipelines within Sensa catalog.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
    .action(withCompatibilityCheck((pipelineRepoName, options) => {
      try {
        return new UpdateRepoPipelinesCommand(repos).execute(pipelineRepoName, options);
      } catch (err) {
        return printError(err.message);
      }
    }));

  return repos;
}

if (esMain(import.meta)) {
  create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
