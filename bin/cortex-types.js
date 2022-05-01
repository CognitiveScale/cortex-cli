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
const program = require('commander');

const { withCompatibilityCheck } = require('../src/compatibility');
const { DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SORT_PARAMS } = require('../src/constants');

const {
    SaveTypeCommand,
    ListTypesCommand,
    DescribeTypeCommand,
} = require('../src/commands/types');

program.name('cortex types');
program.description('Work with Cortex Types');

// Save Type
program
    .command('save <typeDefinition>')
    .description('Save a type definition')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('-y, --yaml', 'Use YAML for type definition format')
    .action(withCompatibilityCheck((typeDefinition, options) => {
        try {
            new SaveTypeCommand(program).execute(typeDefinition, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Types
program
    .command('list')
    .description('List type definitions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--limit [limit]', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip [skip]', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort [sort]', 'A Mongo style sort statement to use in the query.', DEFAULT_LIST_SORT_PARAMS)
    .action(withCompatibilityCheck((options) => {
        try {
            new ListTypesCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Type
program
    .command('describe <typeName>')
    .alias('get')
    .description('Describe type')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((typeName, options) => {
        try {
            new DescribeTypeCommand(program).execute(typeName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
