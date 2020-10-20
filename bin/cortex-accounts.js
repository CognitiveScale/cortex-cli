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
const program = require('../src/commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    CreateGroupCommand,
    AddMembersToGroupCommand,
    ListGroupsCommand,
    DescribeGroupCommand,
    DeleteGroupCommand,
    RemoveMembersFromGroupCommand,
    RegisterResourceCommand,
    GrantGroupAccessToResourceCommand,
} = require('../src/commands/accounts');

program.description('Work with Cortex Accounts');

// Create Group
program
    .command('create-groups <groupName>')
    .description('Create a group')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--description [description]', 'Group description')
    .action(withCompatibilityCheck((groupName, options) => {
        try {
            new CreateGroupCommand(program).execute(groupName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Add Members to Group
program
    .command('add-members-groups <groupName> [members...]')
    .description('Add members to group')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((groupName, members, options) => {
        try {
            new AddMembersToGroupCommand(program).execute(groupName, members, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Groups
program
    .command('list-groups')
    .description('List groups')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListGroupsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Group
program
    .command('describe-groups <groupName>')
    .description('Describe a group')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((groupName, options) => {
        try {
            new DescribeGroupCommand(program).execute(groupName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Group
program
    .command('delete-groups <groupName>')
    .description('Delete a group')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((groupName, options) => {
        try {
            new DeleteGroupCommand(program).execute(groupName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Remove Members From Group
program
    .command('remove-members-groups <groupName> [members...]')
    .description('Remove members from a group')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((groupName, members, options) => {
        try {
            new RemoveMembersFromGroupCommand(program).execute(groupName, members, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Register Resource
program
    .command('register-resources <resourceName>')
    .description('Register a resource')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--description [description]', 'Resource description')
    .option('--access [access]', 'Access level of resource [read/write/admin/execute]')
    .action(withCompatibilityCheck((resourceName, options) => {
        try {
            new RegisterResourceCommand(program).execute(resourceName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Grant Group Access To Resource
program
    .command('grant-group-access-resources <resourceId> <groupName>')
    .description('Grant group access to a resource')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((resourceId, groupName, options) => {
        try {
            new GrantGroupAccessToResourceCommand(program).execute(resourceId, groupName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
