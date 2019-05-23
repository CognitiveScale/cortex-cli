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

program.description('Work with Cortex Marketplace Datasets');

// Save dataset in marketplace
program
    .command('save <datasetDefinition> <executablePath>')
    .description('Save dataset in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for dataset definition format')
    .option('-z, --zip', 'Use zip file to gather the executables')
    .action(withCompatibilityCheck((datasetDefinition, executablePath, options) => {
        try {
            new SaveResourceCommand(program, 'dataset').execute(datasetDefinition, executablePath, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List datasets of marketplace
program
    .command('list')
    .description('List datasets in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--sort [sort]', 'To sort datasets by any field')
    .option('--offset [offset]', 'Skip the number of datasets in the response')
    .option('--limit [limit]', 'Limit the number of datasets in the response')
    .option('--private', 'List only private datasets', false)
    .action(withCompatibilityCheck((options) => {
        try {
            new ListResourceCommand(program, 'dataset').execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe dataset of marketplace
program
    .command('describe <datasetNameWithNamespace>')
    .description('Get details of a dataset from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((datasetNameWithNamespace, options) => {
        try {
            new DescribeResourceCommand(program, 'dataset').execute(datasetNameWithNamespace, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete dataset from marketplace
program
    .command('delete <datasetNameWithNamespace>')
    .description('Delete a dataset from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((datasetNameWithNamespace, options) => {
        try {
            new DeleteResourceCommand(program, 'dataset').execute(datasetNameWithNamespace, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Search dataset in marketplace
program
    .command('search [searchString]')
    .description('Search datasets in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--filter [filter]', 'Filter query object to search')
    .option('--sort [sort]', 'To sort datasets by any field')
    .option('--offset [offset]', 'Skip the number of datasets in the response')
    .option('--limit [limit]', 'Limit the number of datasets in the response')
    .option('--private', 'List only private datasets', false)
    .action(withCompatibilityCheck((searchString, options) => {
        try {
            new SearchResourceCommand(program, 'dataset').execute(searchString, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Install dataset from marketplace
program
    .command('install <datasetNameWithNamespace>')
    .description('Install a dataset from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((datasetNameWithNamespace, options) => {
        try {
            new InstallResourceCommand(program, 'dataset').execute(datasetNameWithNamespace, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


program.parse(process.argv);