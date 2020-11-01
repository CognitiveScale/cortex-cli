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
const program = require('../src/commander');

const {
    ConfigureCommand,
    DescribeProfileCommand,
    ListProfilesCommand,
    SetProfileCommand,
    GetAccessToken,
} = require('../src/commands/configure');

program
    .option('--file [file]', 'Personal access config file location')
    .option('--profile [profile]', 'The profile to configure')
    .option('--project [project]', 'The default project to use')
    .description('Configure the Cortex CLI');

program.command('create', { isDefault: true })
    .description('Authenticate to cortex (default command)')
    .option('--file [file]', 'Personal access config file location')
    .option('--profile [profile]', 'The profile to configure')
    .option('--project [project]', 'The default project')
    .action(() => {
        new ConfigureCommand(program).execute({ profile: program.profile, color: program.color });
    });

program
    .command('token')
    .description('Create access token')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .action(() => {
        try {
            new GetAccessToken(program).execute({
                profile: program.profile,
                project: program.project,
                color: program.color,
            });
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on');

program
    .command('list')
    .description('List configured profiles')
    .action(() => {
        new ListProfilesCommand(program).execute({ color: program.color });
    });

program
    .command('describe <profileName>')
    .description('Describe a configured profile')
    .action((profileName) => {
        new DescribeProfileCommand(program).execute({ profile: profileName, color: program.color });
    });

program
    .command('set-profile <profileName>')
    .description('Sets the current profile.')
    .action((profileName) => {
        new SetProfileCommand(program).execute(profileName, { color: program.color });
    });

program.parse(process.argv);
