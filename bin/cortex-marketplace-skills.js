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

program.description('Work with Cortex Marketplace Skills');

// Save Skill in marketplace
program
    .command('save <skillDefinitionZip>')
    .description('Save skill in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((skillDefinitionZip, options) => {
        try {
            new SaveResourceCommand(program, 'skill').execute(skillDefinitionZip, options);
        }
        catch (err) {
            console.log(err);
            console.error(chalk.red(err.message));
        }
    }));

// List Skills of marketplace
program
    .command('list')
    .description('List skills in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--sort [sort]', 'To sort skills by any field')
    .option('--offset [offset]', 'Skip the number of skills in the response')
    .option('--limit [limit]', 'Limit the number of skills in the response')
    .option('--all', 'List all private and public skills', false)
    .action(withCompatibilityCheck((options) => {
        try {
            new ListResourceCommand(program, 'skill').execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Skill of marketplace
program
    .command('describe <skillName>')
    .description('Get details of a skill from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((skillName, options) => {
        try {
            new DescribeResourceCommand(program, 'skill').execute(skillName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Skill from marketplace
program
    .command('delete <skillName>')
    .description('Delete a skill from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((skillName, options) => {
        try {
            new DeleteResourceCommand(program, 'skill').execute(skillName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Search Skill in marketplace
program
    .command('search [searchString]')
    .description('Search skills in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--filter [filter]', 'Filter query(a JSON string) to search')
    .option('--sort [sort]', 'To sort skills by any field')
    .option('--offset [offset]', 'Skip the number of skills in the response')
    .option('--limit [limit]', 'Limit the number of skills in the response')
    .option('--all', 'Search on all private and public skills', false)
    .action(withCompatibilityCheck((searchString, options) => {
        try {
            new SearchResourceCommand(program, 'skill').execute(searchString, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Install Skill from marketplace
program
    .command('install <skillName>')
    .description('Install a skill from marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((skillName, options) => {
        try {
            new InstallResourceCommand(program, 'skill').execute(skillName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Execute Skill in marketplace
program
    .command('execute <skillName>')
    .description('Execute a skill in marketplace')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--params [params]', 'JSON params to use as input for execution of skill action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .option('--route <route>', 'Action name to invoke on execute')
    .option('-y, --yaml', 'Use YAML for paramsFile option')
    .action(withCompatibilityCheck((skillName, options) => {
        try {
            new ExecuteResourceCommand(program, 'skill').execute(skillName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);