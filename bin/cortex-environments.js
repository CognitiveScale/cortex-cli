#!/usr/bin/env node

/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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
const helper = require('./utils.js');

const {
    ListEnvironments,
    SaveEnvironmentCommand,
    PromoteEnvironmentCommand,
    DescribeEnvironmentCommand,
    ListInstancesCommand
} = require('../src/commands/environments');

let processed = false;
program.description('Work with Cortex Environments');


// List Environments
program
    .command('list')
    .description('List environments')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListEnvironments(program).execute(options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Save Environement
program
    .command('save <environmentDefinition>')
    .description('Create an environment. Takes JSON file by default.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for environment definition format')
    .action(withCompatibilityCheck((envDefinition, options) => {
        try {
            new SaveEnvironmentCommand(program).execute(envDefinition, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Promote Environment
program
    .command('promote [promotionDefinition]')
    .description('Promote a snapshot to an environment. Takes JSON file by default.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for environment definition format')
    .option('--snapshotId [snapshotId]', 'SnapshotID to promote')
    .option('--environmentName [environmentName]', 'Environment to promote snapshotId to')
    .action(withCompatibilityCheck((promotionDefinition, options) => {
        try {
            new PromoteEnvironmentCommand(program).execute(promotionDefinition, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Environment
program
    .command('describe <environmentName>')
    .description('Describe environment')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((environmentName, options) => {
        try {
            new DescribeEnvironmentCommand(program).execute(environmentName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));



// List Instances in Environment
program
    .command('list-instances [environmentName]')
    .description('List instances in environment')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((environmentName, options) => {
        try {
            new ListInstancesCommand(program).execute(environmentName || 'cortex/default', options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

process.env.DOC && require('../src/commands/utils').exportDoc(program);
program.parse(process.argv);
if (!processed)
    ['string', 'undefined'].includes(typeof program.args[0]) && helper.helpAndExit(program);
