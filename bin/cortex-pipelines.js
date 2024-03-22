#!/usr/bin/env node
import esMain from 'es-main';
import { Command } from 'commander';
import {
  ListPipelineCommand,
  DescribePipelineCommand,
  RunPipelineCommand,
  DescribePipelineRunCommand,
  ListPipelineRunsCommand,
  PipelineTemplateConfigureCommand,
  PipelineGenerateCommand,
} from '../src/commands/pipelines.js';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
  LIST_JSON_HELP_TEXT,
  DEFAULT_LIST_LIMIT_COUNT,
  DEFAULT_LIST_SKIP_COUNT,
  GET_DEFAULT_SORT_CLI_OPTION,
  DEFAULT_LIST_SORT_PARAMS,
  QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';
import { printError, checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
  const pipelines = new Command();
  pipelines.name('cortex pipelines');
  pipelines.description('Work with Cortex Pipelines');
  pipelines.command('repos <cmd>', 'Work with Cortex Pipeline Repositories');

  // List
  pipelines
    .command('list')
    .alias('l')
    .description('List Pipelines')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--repo <pipelineRepo>', 'Convenience flag for filtering by Pipeline Repository. Has a lower priority than --filter')
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
  .command('describe <pipelineName> <gitRepoName>')
  .alias('get')
  .description('Describe a Pipeline')
  .option('--sha [sha]', 'Filter by SHA - to find specific version of the pipeline')
  .option('--no-compat', 'Ignore API compatibility checks')
  .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
  .option('--profile <profile>', 'The profile to use')
  .option('--project <project>', 'The project to use')
  .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
  .action(withCompatibilityCheck((pipelineName, gitRepoName, options) => {
    try {
      checkForEmptyArgs({ pipelineName, gitRepoName });
      return new DescribePipelineCommand(pipelines).execute(pipelineName, gitRepoName, options);
    } catch (err) {
      return printError(err.message);
    }
  }));
  
  // Run Pipeline
  pipelines
  .command('run <pipelineName> <gitRepoName>')
  .description('Run a Pipeline')
  .option('--no-compat', 'Ignore API compatibility checks')
  .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
  .option('--profile <profile>', 'The profile to use')
  .option('--project <project>', 'The project to use')
  .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
  .option('--params <params>', 'JSON params to send to the action')
  .option('--params-file <paramsFile>', 'A file containing either JSON or YAML formatted params')
  .option('--commit <commit>', 'Git SHA for pipeline repository')
  .option('--block <block>', 'Block name to run a specific block')
  .option('--scheduleName <name>', 'Identifier to uniquely identify a Pipelines schedule')
  .option('--scheduleCron <cron>', 'Schedule Pipeline to run periodically using a cron schedule string for example: "0 0 * * *", @hourly, or @daily')
  .action(withCompatibilityCheck((pipelineName, gitRepoName, options) => {
    try {
      checkForEmptyArgs({ pipelineName, gitRepoName });
      return new RunPipelineCommand(pipelines).execute(pipelineName, gitRepoName, options);
    } catch (err) {
      return printError(err.message);
    }
  }));

  // Describe Pipeline Run
  pipelines
  .command('describe-run <runId>')
  .alias('get-run')
  .description('Describe a Pipeline Run')
  .option('--no-compat', 'Ignore API compatibility checks')
  .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
  .option('--profile <profile>', 'The profile to use')
  .option('--project <project>', 'The project to use')
  .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
  .action(withCompatibilityCheck((runId, options) => {
    try {
      checkForEmptyArgs({ runId });
      return new DescribePipelineRunCommand(pipelines).execute(runId, options);
    } catch (err) {
      return printError(err.message);
    }
  }));

  // List Pipeline Run
  pipelines
  .command('list-runs <pipelineName> <gitRepoName>')
  .alias('lr')
  .description('List all Runs for a Pipeline')
  .option('--no-compat', 'Ignore API compatibility checks')
  .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
  .option('--profile <profile>', 'The profile to use')
  .option('--project <project>', 'The project to use')
  .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
  .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
  .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
  .action(withCompatibilityCheck((pipelineName, gitRepoName, options) => {
    try {
      checkForEmptyArgs({ pipelineName, gitRepoName });
      return new ListPipelineRunsCommand(pipelines).execute(pipelineName, gitRepoName, options);
    } catch (err) {
      return printError(err.message);
    }
  }));


  // Configure Pipeline Template Github Repository
  pipelines
    .command('configure')
    .option('--refresh', 'Refresh the Github access token')
    .description('Configure the Cortex Template system for generating Pipeline templates')
    .action((options) => {
      try {
        return new PipelineTemplateConfigureCommand(pipelines).execute(options);
      } catch (err) {
        return printError(err.message);
      }
    });

  // Generate a Pipeline template
  pipelines.command('generate [pipelineName] [destination]')
    .option('--notree [boolean]', 'Do not dispaly generated file tree', 'false')
    .option('--template <templateName>', 'Name of the template to use')
    .description('Generates a folder based on a Pipeline template from the template repository')
    .action((pipelineName, destination, options) => {
      try {
        return new PipelineGenerateCommand(pipelines).execute(pipelineName, destination, options);
      } catch (err) {
        return printError(err.message);
      }
    });

  return pipelines;
}

if (esMain(import.meta)) {
  create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
