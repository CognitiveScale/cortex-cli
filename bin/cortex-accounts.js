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
const chalk = require('chalk');

const {
    CreateGroupCommand,
    AddMembersToGroupCommand,
} = require('../src/commands/accounts');

let processed = false;
program.description('Work with Cortex Accounts');

// Create Group
program
    .command('groups-create <groupName>')
    .description('Create a group')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--description [description]', 'Group description')
    .action((groupName, options) => {
        try {
            new CreateGroupCommand(program).execute(groupName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Add Members to Group
program
    .command('groups-add-members <groupName> [members...]')
    .description('Create a group')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((groupName, members, options) => {
        try {
            new AddMembersToGroupCommand(program).execute(groupName, members, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

process.env.DOC && require('../src/commands/utils').exportDoc(program);

program.parse(process.argv);
if (!processed)
    ['string', 'undefined'].includes(typeof program.args[0]) && program.help();