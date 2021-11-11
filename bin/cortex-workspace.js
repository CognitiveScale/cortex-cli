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

const {
    WorkspaceConfigureCommand,
    WorkspaceGenerateCommand,
} = require('../src/commands/workspace');

program.name('cortex workspace');
program.description('Scaffolding Cortex Components');

program
    .command('configure')
    .option('--refresh', 'Refresh the Github access token')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .description('Configures the Cortex Template System for generating skill templates')
    .action((options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceConfigureCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program
    .command('generate [name] [destination]')
    .option('--registry [registry]', 'Override the docker registry to publish to')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .option('--notree', 'Do not display generated file tree', false)
    .description('Generates a workspace based on a template from the template repository')
    .action((name, destination, options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceGenerateCommand(program).execute(name, destination, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
