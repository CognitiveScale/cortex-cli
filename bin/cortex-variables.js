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
    ListVariablesCommand,
    ReadVariableCommand,
    WriteVariableCommand,
} = require('../src/commands/variables');

let processed = false;
program.description('Work with Cortex Secure Variables');

// List Secure Variable Keys
program
    .command('list')
    .description('List secure variable keys')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListVariablesCommand(program).execute(options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Read Secure Variable Value
program
    .command('describe <keyName>')
    .description('Retrieve the value stored for the given variable key.')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((keyName, options) => {
        try {
            new ReadVariableCommand(program).execute(keyName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Write Secure Variable Value
program
    .command('save <keyName> [value]')
    .description('Save or overwrite a secure variable value. By default, values are stored as strings but can also be saved as JSON or YAML values.')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--data [data]', 'JSON value to save')
    .option('--data-file [dataFile]', 'A file containing either JSON or YAML formatted value to save')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((keyName, value, options) => {
        try {
            new WriteVariableCommand(program).execute(keyName, value, options);
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