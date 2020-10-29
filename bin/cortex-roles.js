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


/*Grant resource + actions to user
Grant resource + actions to role
Assign user to fabric role ( alternative to external groups )
Remove user from fabric role
Remove grant from user
Remove grant from fabric  role
Get my permissions ( using JWT )
Get someone else’s permission ( can’t account for external groups..)
List fabric roles
Get role’s permissions


cortex roles create|grant
--role = The entity that is being granted access
--project = The project this applies to ( * for all projects )
--resource = The resource <type>.<name> that that grant is against ( * for all resource )
--actions = READ|WRITE|EXECUTE|DENY … DENY trumps all ( * for all actions )
Create or update a role

Cortex roles assign --role --project --assignee[]  --project [--delete]
Assign/UnAssign user(s) to role

Cortex roles list [--project] [--user]
List roles by project and/or user

Cortex role describe --role --project
Dump role’s permissions and assignees

Cortex roles delete --role --project
Remove a role and all assignments

Cortex roles mapping --role --external-group [--delete]
Manage group role mappings
Or delete..

Cortex roles list-mappings
List role external group mappings

Cortex users grant --project --actions --resource
Grant user permission to a resource

Cortex users l [--user]
List grants for a user (admin) or myself by default*/

const chalk = require('chalk');
const program = require('../src/commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
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
    .option('--user [user]', 'User to list roles for')
    .option('--project [project', 'Project to list roles for')
    .action(withCompatibilityCheck((options) => {
        try {
            new RoleListCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('describe <role>')
    .description('Describe role grants and users')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--users', 'List users associated with role')
    .option('--no-grants', 'Ignore grants associated with role')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleDescribeCommand(program).execute(role, options);
        }
        catch (err) {
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
        }
        catch (err) {
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
    .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | deny | *')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleCreateCommand(program).execute(role, options);
        }
        catch (err) {
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
    .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | deny | *')
    .option('--delete', 'Remove grant from role')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleGrantCommand(program).execute(role, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.command('assign <role>')
    .description('Manage a list of user assignments on a role')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .requiredOption('--users <users...>', 'Users to add/remove on role')
    .option('--delete', 'Unassign users from role')
    .action(withCompatibilityCheck((role, options) => {
        try {
            new RoleAssignCommand(program).execute(role, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
