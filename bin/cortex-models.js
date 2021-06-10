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
const program = require('../src/commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    DeleteModelCommand,
    SaveModelCommand,
    DescribeModelCommand,
    ListModelsCommand,
    ListModelRunsCommand,
} = require('../src/commands/models');

program.description('Work with Cortex Models');

// List Models
program
    .command('list')
    .description('List model definitions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--offset [offset]', 'The offset to use')
    .option('--limit [limit]', 'The limit to use')
    .option('--tags [tags]', 'The tags to use (comma separated values)')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
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
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
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
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
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
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('-y, --yaml', 'Use YAML for model definition format')
    .action(withCompatibilityCheck((modelDefinition, options) => {
        try {
            new SaveModelCommand(program).execute(modelDefinition, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List model runs
program
    .command('list-runs <modelName>')
    .description('list model run')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((modelName, options) => {
        try {
            new ListModelRunsCommand(program).execute(modelName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


program.parse(process.argv);
