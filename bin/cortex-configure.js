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

const program = require('commander');
const { ConfigureCommand, DescribeProfileCommand, ListProfilesCommand, SetProfileCommand } = require('../src/commands/configure');

program.description('Configure the Cortex CLI');

let cmd = undefined;

program
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to configure');

program
    .command('list')
    .description('List configured profiles')
    .action((options) => {
        cmd = 'list';
        new ListProfilesCommand(program).execute({color: program.color});
    });

program
    .command('describe <profileName>')
    .description('Describe a configured profile')
    .action((profileName, options) => {
        cmd = 'describe';
        new DescribeProfileCommand(program).execute({profile: profileName, color: program.color});
    });

program
    .command('set-profile <profileName>')
    .description('Sets the current profile.')
    .action((profileName, options) => {
        cmd = 'set-profile';
        new SetProfileCommand(program).execute(profileName, {color: program.color});
    });

program.parse(process.argv);

if (cmd === undefined) {
    new ConfigureCommand(program).execute({profile: program.profile, color: program.color});
}