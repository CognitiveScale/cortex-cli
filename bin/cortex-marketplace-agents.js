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
    InstallResourceCommand,
    ExecuteResourceCommand
} = require('../src/commands/marketplace');

program.description('Work with Cortex Marketplace Agents');

// Save agent in marketplace
program
    .command('save <agentDefinition> <executablePath>')
    .description('Save agent in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for agent definition format')
    .option('-z, --zip', 'Use zip file to gather the executables')
    .action(withCompatibilityCheck((agentDefinition, executablePath, options) => {
        try {
            new SaveResourceCommand(program, 'agent').execute(agentDefinition, executablePath, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List agents of marketplace
program
    .command('list')
    .description('List agents in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--sort [sort]', 'To sort agents by any field')
    .option('--offset [offset]', 'Skip the number of agents in the response')
    .option('--limit [limit]', 'Limit the number of agents in the response')
    .option('--private', 'List only private agents', false)
    .action(withCompatibilityCheck((options) => {
        try {
            new ListResourceCommand(program, 'agent').execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe agent of marketplace
program
    .command('describe <resourceName>')
    .description('Get details of a agent from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((resourceName, options) => {
        try {
            new DescribeResourceCommand(program, 'agent').execute(resourceName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete agent of marketplace
program
    .command('delete <resourceName>')
    .description('Delete a agent from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((resourceName, options) => {
        try {
            new DeleteResourceCommand(program, 'agent').execute(resourceName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Search agent in marketplace
program
    .command('search [searchString]')
    .description('Search agents in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--filter [filter]', 'Filter query object to search')
    .option('--sort [sort]', 'To sort agents by any field')
    .option('--offset [offset]', 'Skip the number of agents in the response')
    .option('--limit [limit]', 'Limit the number of agents in the response')
    .option('--private', 'List only private agents', false)
    .action(withCompatibilityCheck((searchString, options) => {
        try {
            new SearchResourceCommand(program, 'agent').execute(searchString, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Install agent from marketplace
program
    .command('install <resourceName>')
    .description('Install a agent from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((resourceNameWithNamespace, options) => {
        try {
            new InstallResourceCommand(program, 'agent').execute(resourceNameWithNamespace, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


program.parse(process.argv);