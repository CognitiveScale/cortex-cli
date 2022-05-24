#!/usr/bin/env node

/*
 * Copyright 2019 Cognitive Scale, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const chalk = require('chalk');
const { program } = require('commander');

const { withCompatibilityCheck } = require('../src/compatibility');
const { DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT } = require('../src/constants');

const {
    ListExperiments,
    DescribeExperimentCommand,
    ListRuns,
    DescribeRunCommand,
    DeleteRunCommand,
    DeleteExperimentCommand,
    DownloadArtifactCommand,
    SaveExperimentCommand,
    CreateRunCommand,
    UploadArtifactCommand,
} = require('../src/commands/experiments');

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
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.')
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
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((experimentName, options) => {
        try {
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
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.')
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
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((experimentName, runId, options) => {
        try {
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
            new UploadArtifactCommand(program).execute(experimentName, runId, filePath, artifactKey, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
