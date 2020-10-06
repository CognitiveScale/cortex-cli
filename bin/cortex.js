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

const findPackageJson = require('find-package-json');
const identity = require('lodash/fp/identity');

const program = require('../src/commander');

const pkg = findPackageJson(__dirname).next().value;

program
    .version(pkg.version, '-v, --version')
    .description('Cortex CLI')
    .command('accounts [cmd]', 'Work with Cortex Accounts')
    .command('actions [cmd]', 'Work with Cortex Actions')
    .command('agents [cmd]', 'Work with Cortex Agents')
    .command('configure', 'Configure the Cortex CLI')
    .command('connections [cmd]', 'Work with Cortex Connections')
    .command('content [cmd]', 'Work with Cortex Managed Content')
    .command('environments [cmd]', 'Work with Cortex Environments')
    .command('deploy [cmd]', 'Work with Cortex Artifacts export for deployment')
    .command('datasets [cmd]', 'Work with Cortex Datasets')
    .command('docker [cmd]', 'Work with Docker')
    .command('jobs [cmd]', 'Work with Cortex v2 Jobs')
    .command('project [cmd]', 'Work with a related collection of Cortex contributions')
    .command('skills [cmd]', 'Work with Cortex Skills')
    .command('tasks [cmd]', 'Work with Cortex v2 Tasks')
    .command('types [cmd]', 'Work with Cortex Types')
    .command('variables [cmd]', 'Work with Cortex Secure Variables')
    .command('experiments [cmd]', 'Work with Cortex Experiments')
    .command('profiles [cmd]', 'Work with Cortex Profiles')
    .command('graph [cmd]', 'Work with the Cortex Graph');

program.parse(process.argv, { noActionHandler: function() {

}});
if (!program.commands.map(cmd => cmd._name).includes(program.args[0])) {
    program.outputHelp(identity);
    process.exit(1);
}

