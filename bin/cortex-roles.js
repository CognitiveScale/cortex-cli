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

const { withCompatibilityCheck } = require('../src/compatibility');
const { nonEmptyStringParser } = require('../src/parsers');

const {
    ExternalGroupAssignCommand,
    ExternalGroupDeleteCommand,
    ExternalGroupDescribeCommand,
    ExternalGroupListCommand,
    RoleProjectAssignCommand,
    RoleAssignCommand,
    RoleCreateCommand,
    RoleDeleteCommand,
    RoleGrantCommand,
    RoleDescribeCommand,
    RoleListCommand,
} = require('../src/commands/roles');

program.description('Work with Cortex Roles');

program.command('list')
    .description('List roles by project and user')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project', 'Project to list roles for')
    .action(withCompatibilityCheck((options) => {
        try {
            new RoleListCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('describe <role>')
    .alias('get')
    .description('Describe role grants and users')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--users', 'List users associated with role')
    .option('--no-grants', 'Ignore grants associated with role')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleDescribeCommand(program).execute(role, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


program.command('delete <role>')
    .description('Delete a role and remove grants/assignments')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleDeleteCommand(program).execute(role, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('create <role>')
    .description('Create a role with the given grant')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .requiredOption('--project <project>', 'Grant project')
    .requiredOption('--resource <resource>', 'Grant resource')
    .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | *')
    .option('--deny', 'Explicit deny of action(s)')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleCreateCommand(program).execute(role, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('grant <role>')
    .description('Manage grants on an existing role')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .requiredOption('--project <project>', 'Grant project')
    .requiredOption('--resource <resource>', 'Grant resource')
    .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | *')
    .option('--delete', 'Remove grant from role')
    .option('--deny', 'Explicit deny of action(s)')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleGrantCommand(program).execute(role, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('assign <role>')
    .description('Manage a list of user assignments on a role')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .requiredOption('--users <users...>', 'Users to add/remove on role', nonEmptyStringParser('user names must not be empty'))
    .option('--delete', 'Unassign users from role')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleAssignCommand(program).execute(role, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('project <project>')
    .description('Manage a list of role assignments on a project')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .requiredOption('--roles <roles...>', 'Roles to add/remove on project')
    .option('--delete', 'Unassign roles from project')
    .action(withCompatibilityCheck((project, options) => {
        try {
            new RoleProjectAssignCommand(program).execute(project, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('list-external')
    .description('List external groups')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((options) => {
        try {
            new ExternalGroupListCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('describe-external <externalGroup>')
    .alias('get')
    .description('Describe external group roles and users')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--users', 'List users associated with external group')
    .option('--roles', 'List roles associated with external group')
    .action(withCompatibilityCheck((externalGroup, options) => {
        try {
            new ExternalGroupDescribeCommand(program).execute(externalGroup, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('delete-external <externalGroup>')
    .description('Delete an external group and remove assignments')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((externalGroup, options) => {
        try {
            new ExternalGroupDeleteCommand(program).execute(externalGroup, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('assign-external')
    .description('Manage an external group assignment on a role')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .requiredOption('--role <role>', 'Role to add/remove assignment')
    .requiredOption('--externalGroup <externalGroup>', 'External group to add/remove on role')
    .option('--delete', 'Unassign external group from role')
    .action(withCompatibilityCheck((options) => {
        try {
            new ExternalGroupAssignCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));
program.parse(process.argv);
