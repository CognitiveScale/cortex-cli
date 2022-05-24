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

program.name('cortex generate');
program.description('Scaffolding Cortex Components [DEPRECATED]');

program
    .command('skill [skillName] [type]')
    .description('Generates the structure and top level build script for a skill in current directory')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .action(() => { // deliberately not using withCompatibilityCheck()
        console.error(chalk.red('Generate command has been superceded by the Workspaces command.'));
    });

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
