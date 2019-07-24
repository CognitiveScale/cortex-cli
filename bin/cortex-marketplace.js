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

const identity = require('lodash/fp/identity');

const program = require('../src/commander');

program
    .description('Cortex Marketplace CLI')
    .command('agents [cmd]', 'Work with Cortex Marketplace Agents')
    .command('datasets [cmd]', 'Work with Cortex Marketplace Datasets')
    .command('connections [cmd]', 'Work with Cortex Marketplace Connections')
    .command('skills [cmd]', 'Work with Cortex Marketplace Skills');

program.parse(process.argv, { noActionHandler: function() {

}});

if (!program.commands.map(cmd => cmd._name).includes(program.args[0])) {
    program.outputHelp(identity);
    process.exit(1);
}