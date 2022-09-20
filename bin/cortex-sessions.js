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
const { program } = require('commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    DeleteSessionCommand,
    SaveSessionCommand,
    DescribeSessionCommand,
    ListSessionsCommand,
} = require('../src/commands/sessions');
const {
    DEFAULT_LIST_LIMIT_COUNT,
    LIST_JSON_HELP_TEXT,
    QUERY_JSON_HELP_TEXT,
} = require('../src/constants');

program.name('cortex sessions');
program.description('Work with Cortex Sessions');

// List Sessions
program
    .command('list')
    .description('List session definitions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--limit <limit>', 'Number of sessions to list', DEFAULT_LIST_LIMIT_COUNT)
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
    .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
    .action(withCompatibilityCheck((options) => {
        try {
            new ListSessionsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Session
program
    .command('describe <sessionId>')
    .description('Describe session')
    .alias('get')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
    .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
    .option('--verbose', 'Verbose output')
    .action(withCompatibilityCheck((sessionName, options) => {
        try {
            new DescribeSessionCommand(program).execute(sessionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Session
program
    .command('delete <sessionId>')
    .description('Delete a session')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck((sessionName, options) => {
        try {
            new DeleteSessionCommand(program).execute(sessionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Save Session
program
    .command('save <sessionDefinition>')
    .description('Save a session definition')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('-y, --yaml', 'Use YAML for session definition format')
    .action(withCompatibilityCheck((sessionDefinition, options) => {
        try {
            new SaveSessionCommand(program).execute(sessionDefinition, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
