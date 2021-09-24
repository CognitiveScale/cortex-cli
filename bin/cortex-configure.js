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
// const program = require('commander');
const program = require('commander');

const {
    ConfigureCommand,
    DescribeProfileCommand,
    ListProfilesCommand,
    SetProfileCommand,
    GetAccessToken,
    PrintEnvVars,
} = require('../src/commands/configure');

program.name('cortex configure');
program.description('Configure cortex connection profiles');

program
    .option('--file [file]', 'Personal access config file location')
    .option('--profile [profile]', 'The profile to configure', 'default')
    .option('--project [project]', 'The default project to use')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .description('Configure the Cortex CLI');

program.command('create', { isDefault: true })
    .description('Authenticate to cortex (default command)')
    .option('--file [file]', 'Personal access config file location')
    .option('--profile [profile]', 'The profile to configure', 'default')
    .option('--project [project]', 'The default project')
    .action(() => {
        try {
            new ConfigureCommand(program).execute();
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program
    .command('token')
    .description('Create access token')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--ttl [time]', 'The amount of time for this login to remain active, expressed as a number of hours, days, or weeks (e.g. 1h, 2d, 2w)', '1d')
    .action((options) => {
        try {
            new GetAccessToken(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program
    .command('list')
    .description('List configured profiles')
    .action(() => {
        new ListProfilesCommand(program).execute({ color: program.color });
    });

program
    .command('describe <profileName>')
    .alias('get')
    .description('Describe a configured profile')
    .action((profileName) => new DescribeProfileCommand(program).execute({ profile: profileName, color: program.color }));

program
    .command('env')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--ttl [time]', 'The amount of time for this login to remain active, expressed as a number of hours, days, or weeks (e.g. 1h, 2d, 2w)', '1d')
    .description('Print cortex environment variables')
    .action(() => {
        new PrintEnvVars(program).execute();
    });

program
    .command('set-profile <profileName>')
    .description('Sets the current profile.')
    .action((profileName) => {
        new SetProfileCommand(program).execute(profileName, { color: program.color });
    });

if (process.env.NODE_ENV !== 'test') {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
