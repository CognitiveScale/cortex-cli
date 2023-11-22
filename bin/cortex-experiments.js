#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
    DEFAULT_LIST_LIMIT_COUNT,
    DEFAULT_LIST_SKIP_COUNT,
    DEFAULT_LIST_SORT_PARAMS,
    GET_DEFAULT_SORT_CLI_OPTION,
    LIST_JSON_HELP_TEXT,
    QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';
import {
    CreateRunCommand,
    DeleteExperimentCommand,
    DeleteRunCommand,
    DescribeExperimentCommand,
    DescribeRunCommand,
    DownloadArtifactCommand,
    ListExperiments,
    ListRuns,
    SaveExperimentCommand,
    UploadArtifactCommand,
} from '../src/commands/experiments.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.name('cortex experiments');
    program.description('Work with Cortex Experiments');
// List Experiments
    program
        .command('list')
        .description('Find experiments')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--model <model>', 'The model to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
        .action(withCompatibilityCheck((options) => {
            try {
                new ListExperiments(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Describe Experiment
    program
        .command('describe <experimentName>')
        .description('Describe experiment')
        .alias('get')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck((experimentName, options) => {
            try {
                checkForEmptyArgs([experimentName]);
                new DescribeExperimentCommand(program).execute(experimentName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Delete Experiment
    program
        .command('delete <experimentName>')
        .description('Delete an experiment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((experimentName, options) => {
            try {
                checkForEmptyArgs([experimentName]);
                new DeleteExperimentCommand(program).execute(experimentName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// List Runs
    program
        .command('list-runs <experimentName>')
        .description('Find runs within an experiment')
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
        .action(withCompatibilityCheck((experimentName, options) => {
            try {
                new ListRuns(program).execute(experimentName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Describe Run
    program
        .command('describe-run <experimentName> <runId>')
        .description('Describe run')
        .alias('get-run')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck((experimentName, runId, options) => {
            try {
                checkForEmptyArgs([experimentName, runId]);
                new DescribeRunCommand(program).execute(experimentName, runId, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Delete Run
    program
        .command('delete-run <experimentName> <runId>')
        .description('Delete run')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((experimentName, runId, options) => {
            try {
                checkForEmptyArgs([experimentName, runId]);
                new DeleteRunCommand(program).execute(experimentName, runId, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Download Artifact
    program
        .command('download-artifact <experimentName> <runId> <artifactName>')
        .description('Download artifact from run')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((experimentName, runId, artifactName, options) => {
            try {
                checkForEmptyArgs([experimentName, runId, artifactName]);
                new DownloadArtifactCommand(program).execute(experimentName, runId, artifactName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Save Experiment
    program
        .command('save <experimentDefinition>')
        .description('Save an experiment definition')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for experiment definition format')
        .action(withCompatibilityCheck((experimentDefinition, options) => {
            try {
                new SaveExperimentCommand(program).execute(experimentDefinition, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Save Experiment
    program
        .command('create-run <runDefinition>')
        .description('Create run for experiment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for run definition format')
        .action(withCompatibilityCheck((runDefinition, options) => {
            try {
                new CreateRunCommand(program).execute(runDefinition, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Upload Artifact
    program
        .command('upload-artifact <experimentName> <runId> <filePath> <artifactKey>')
        .description('Upload artifact for run')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--content-type <MIME type>', 'Sets the `Content-Type` or MIME type of the content ( default: application/octet-stream )')
        .option('--chunkSize <int>', 'Number of files to simultaneous upload', 10)
        .action(withCompatibilityCheck((experimentName, runId, filePath, artifactKey, options) => {
            try {
                checkForEmptyArgs([experimentName, runId, filePath, artifactKey]);
                new UploadArtifactCommand(program).execute(experimentName, runId, filePath, artifactKey, options);
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
