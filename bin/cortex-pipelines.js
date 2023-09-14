#!/usr/bin/env node
import esMain from 'es-main';
import { Command } from 'commander';
import { ListPipelineCommand, DescribePipelineCommand } from '../src/commands/pipelines.js';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
  LIST_JSON_HELP_TEXT,
  DEFAULT_LIST_LIMIT_COUNT,
  DEFAULT_LIST_SKIP_COUNT,
  GET_DEFAULT_SORT_CLI_OPTION,
  DEFAULT_LIST_SORT_PARAMS,
  QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';
import { printError } from '../src/commands/utils.js';

export function create() {
  const pipelines = new Command();
  pipelines.name('cortex pipelines');
  pipelines.description('Work with Cortex Pipelines');
  pipelines.command('repos <cmd>', 'Work with Cortex Pipeline Repositories');

  // List
  pipelines
    .command('list')
    .description('List Pipelines')
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
        return new ListPipelineCommand(pipelines).execute(options);
      } catch (err) {
        return printError(err.message);
      }
    }));

  // Describe
  pipelines
  .command('describe <pipelineName>')
  .alias('get')
  .description('Describe a Pipeline')
  .option('--no-compat', 'Ignore API compatibility checks')
  .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
  .option('--profile <profile>', 'The profile to use')
  .option('--project <project>', 'The project to use')
  .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
  .action(withCompatibilityCheck((pipelineName, options) => {
    try {
      return new DescribePipelineCommand(pipelines).execute(pipelineName, options);
    } catch (err) {
      return printError(err.message);
    }
  }));

  return pipelines;
}

if (esMain(import.meta)) {
  create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
