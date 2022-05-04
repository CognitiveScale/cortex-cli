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
const { DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT } = require('../src/constants');

const {
    ListConnections,
    SaveConnectionCommand,
    DescribeConnectionCommand,
    ListConnectionsTypes,
    DeleteConnectionCommand,
} = require('../src/commands/connections');

program.name('cortex connections');
program.description('Work with Cortex Connections');

// List Connections
program
    .command('list')
    .description('List connections definitions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListConnections(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Save Connections
program
    .command('save <connectionDefinition>')
    .description('Save a connections definition. Takes JSON file by default.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('-y, --yaml', 'Use YAML for agent definition format')
    .action(withCompatibilityCheck((connDefinition, options) => {
        try {
            new SaveConnectionCommand(program).execute(connDefinition, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Connection
program
    .command('describe <connectionName>')
    .alias('get')
    .description('Describe connection')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((connectionName, options) => {
        try {
            new DescribeConnectionCommand(program).execute(connectionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Connections Types
program
    .command('list-types')
    .description('List connections types')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListConnectionsTypes(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Connection
program
    .command('delete <connectionName>')
    .description('Delete a connection')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck((connectionName, options) => {
        try {
            new DeleteConnectionCommand(program).execute(connectionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
