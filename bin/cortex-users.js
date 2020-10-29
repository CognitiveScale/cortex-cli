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
    UserDescribeCommand,
    UserGrantCommand,
} = require('../src/commands/users');

program.description('Work with Cortex User');

program.command('describe')
    .description('Describe a users grants and roles')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--user [user]', 'The user to describe, self for default')
    .option('--roles', 'Include roles for user')
    .option('--no-grants', 'Ignore grants for user')
    .action(withCompatibilityCheck((options) => {
        try {
            new UserDescribeCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


program.command('grant <user>')
    .description('Manage user grants')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .requiredOption('--project <project>', 'Grant project')
    .requiredOption('--resource <resource>', 'Grant resource')
    .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | deny | *')
    .option('--profile [profile]', 'The profile to use')
    .option('--delete', 'Remove grant from user')
    .action(withCompatibilityCheck((user, options) => {
        try {
            new UserGrantCommand(program).execute(user, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


program.parse(process.argv);
