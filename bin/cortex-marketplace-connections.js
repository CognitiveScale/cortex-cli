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
const program = require('../src/commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    SaveResourceCommand,
    ListResourceCommand,
    DescribeResourceCommand,
    DeleteResourceCommand,
    SearchResourceCommand,
    InstallResourceCommand
} = require('../src/commands/marketplace');

program.description('Work with Cortex Marketplace Connections');

// Save connection in marketplace
program
    .command('save <connectionDefinition>')
    .description('Save connection in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for connection definition format')
    .option('-z, --zip <zip>', 'Use zip file to gather the executables')
    .action(withCompatibilityCheck((connectionDefinition, options) => {
        try {
            new SaveResourceCommand(program, 'connection').execute(connectionDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List connections of marketplace
program
    .command('list')
    .description('List connections in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--sort [sort]', 'To sort connections by any field')
    .option('--offset [offset]', 'Skip the number of connections in the response')
    .option('--limit [limit]', 'Limit the number of connections in the response')
    .option('--all', 'List all private and public connections', false)
    .action(withCompatibilityCheck((options) => {
        try {
            new ListResourceCommand(program, 'connection').execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe connection of marketplace
program
    .command('describe <connectionName>')
    .description('Get details of a connection from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((connectionName, options) => {
        try {
            new DescribeResourceCommand(program, 'connection').execute(connectionName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete connection from marketplace
program
    .command('delete <connectionName>')
    .description('Delete a connection from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((connectionName, options) => {
        try {
            new DeleteResourceCommand(program, 'connection').execute(connectionName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Search connection in marketplace
program
    .command('search [searchString]')
    .description('Search connections in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--filter [filter]', 'Filter query(a JSON string) to search')
    .option('--sort [sort]', 'To sort connections by any field')
    .option('--offset [offset]', 'Skip the number of connections in the response')
    .option('--limit [limit]', 'Limit the number of connections in the response')
    .option('--all', 'Search on all private and public connections', false)
    .action(withCompatibilityCheck((searchString, options) => {
        try {
            new SearchResourceCommand(program, 'connection').execute(searchString, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Install connection from marketplace
program
    .command('install <connectionName>')
    .description('Install a connection from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((connectionName, options) => {
        try {
            new InstallResourceCommand(program, 'connection').execute(connectionName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


program.parse(process.argv);