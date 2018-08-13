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
const program = require('./src/commander');

const { GenerateProjectCommand } = require('../src/commands/project');

program.description('Work with a related collection of Cortex contributions');

// Generate Project
program
    .command('generate')
    .description('Generates the structure and top level build script for a project')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .action((options) => {
        try {
            new GenerateProjectCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);
