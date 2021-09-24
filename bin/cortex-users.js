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

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    UserProjectAssignCommand,
    UserDescribeCommand,
    UserGrantCommand,
    UserCreateCommand,
    UserListCommand,
    UserDeleteCommand,
} = require('../src/commands/users');

program.name('cortex users');
program.description('Work with Cortex User');

program.command('describe')
    .alias('get')
    .description('Describe a users grants and roles')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--user [user]', 'The user to describe, self for default')
    .option('--roles', 'Include grant inheritance from roles')
    .action(withCompatibilityCheck((options) => {
        try {
            new UserDescribeCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('grant <user>')
    .description('Manage user grants')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .requiredOption('--project <project>', 'Grant project')
    .requiredOption('--resource <resource>', 'Grant resource')
    .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | *')
    .option('--profile [profile]', 'The profile to use')
    .option('--delete', 'Remove grant from user')
    .option('--deny', 'Explicit deny of action(s)')
    .action(withCompatibilityCheck((user, options) => {
        try {
            new UserGrantCommand(program).execute(user, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('project <project>')
    .description('Manage a list of user assignments on a project')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .requiredOption('--users <users...>', 'Users to add/remove on project')
    .option('--delete', 'Unassign users from project')
    .action(withCompatibilityCheck((project, options) => {
        try {
            new UserProjectAssignCommand(program).execute(project, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('delete <user>')
    .description('Deletes a service user and disables any existing tokens created by the user')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((user, options) => {
        try {
            new UserDeleteCommand(program).execute(user, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('create <user>')
    .description('Creates a service user (with no assigned roles/grants) that can authenticate with and call Fabric API\'s')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((user, options) => {
        try {
            new UserCreateCommand(program).execute(user, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('list')
    .description('Lists all service users created within Cortex')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((options) => {
        try {
            new UserListCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
