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
const findPackageJson = require('find-package-json');
const { program } = require('commander');

const pkg = findPackageJson(__dirname).next().value;

program.name('cortex');
program
    .version(pkg.version, '-v, --version')
    .description('Cortex CLI')
    .option('--debug', 'Enables verbose output for debugging', false)
    .on('option:debug', () => { process.env.DEBUG = '*'; })
    .command('actions <cmd>', 'Work with Cortex Actions')
    .command('agents <cmd>', 'Work with Cortex Agents')
    .command('assessments <cmd>', 'Work with Cortex Impact Assessments')
    .command('campaigns <cmd>', 'Work with Cortex Campaigns')
    .command('configure', 'Configure the Cortex CLI')
    .command('connections <cmd>', 'Work with Cortex Connections')
    .command('content <cmd>', 'Work with Cortex Managed Content')
    .command('deploy <cmd>', 'Work with Cortex Artifacts export for deployment')
    .command('docker <cmd>', 'Work with Docker')
    .command('experiments <cmd>', 'Work with Cortex Experiments')
    .command('generate <cmd>', 'Scaffold Cortex Components')
    .command('workspaces <cmd>', 'Scaffold Cortex Components')
    .command('missions <cmd>', 'Work with Cortex Missions')
    .command('models <cmd>', 'Work with Cortex Models')
    .command('projects <cmd>', 'Work with Cortex Projects')
    .command('roles <cmd>', 'Work with a Cortex Roles')
    .command('secrets <cmd>', 'Work with Cortex Secrets')
    .command('sessions <cmd>', 'Work with Cortex Sessions')
    .command('skills <cmd>', 'Work with Cortex Skills')
    .command('tasks <cmd>', 'Work with Cortex Tasks')
    .command('types <cmd>', 'Work with Cortex Types')
    .command('users <cmd>', 'Work with a Cortex Users');

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
