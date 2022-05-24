#!/usr/bin/env node

/*
 * Copyright 2020 Cognitive Scale, Inc. All Rights Reserved.
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

const {
    DeleteModelCommand,
    SaveModelCommand,
    DescribeModelCommand,
    ListModelsCommand,
    // RegisterModelCommand,
    UpdateModelStatusCommand,
    ListModelRunsCommand,
} = require('../src/commands/models');
const {
    DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, GET_DEFAULT_SORT_CLI_OPTION, DEFAULT_LIST_SORT_PARAMS,
} = require('../src/constants');

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
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
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
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .option('--verbose', 'Verbose output')
    .action(withCompatibilityCheck((modelName, options) => {
        try {
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
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
    .action(withCompatibilityCheck((modelName, options) => {
        try {
            new ListModelRunsCommand(program).execute(modelName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
