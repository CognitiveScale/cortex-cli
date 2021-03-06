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
    ListSecretsCommand,
    ReadSecretsCommand,
    WriteSecretsCommand,
} = require('../src/commands/secrets');

program.description('Work with Cortex Secrets');

// List Secure Keys
program
    .command('list')
    .description('List secure keys')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--json', 'Output results using JSON')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListSecretsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Read Secure Value
program
    .command('describe <keyName>')
    .alias('get')
    .description('Retrieve the value stored for the given key.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--json', 'Output results using JSON')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((keyName, options) => {
        try {
            new ReadSecretsCommand(program).execute(keyName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Write Secure Value
program
    .command('save <keyName> [value]')
    .description('Save or overwrite a secure value. By default values are stored as strings but can also be saved as JSON or YAML.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--data [data]', 'JSON value to save')
    .option('--data-file [dataFile]', 'A file containing either JSON or YAML formatted value to save')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((keyName, value, options) => {
        try {
            new WriteSecretsCommand(program).execute(keyName, value, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
