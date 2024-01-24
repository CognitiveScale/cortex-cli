#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import process from 'node:process';
import { Command } from 'commander';
import { callCommand } from '../src/compatibility.js';
import { nonEmptyStringParser } from '../src/parsers.js';
import {
    ExternalGroupAssignCommand,
    ExternalGroupDeleteCommand,
    ExternalGroupDescribeCommand,
    ExternalGroupListCommand,
    RoleAssignCommand,
    RoleCreateCommand,
    RoleDeleteCommand,
    RoleDescribeCommand,
    RoleGrantCommand,
    RoleListCommand,
    RoleProjectAssignCommand,
} from '../src/commands/roles.js';
import { LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT } from '../src/constants.js';

export function create() {
    const program = new Command();

    program.name('cortex roles');
    program.description('Work with Cortex Roles');
    program.command('list')
        .description('List roles by project and user')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'Project to list roles for')
        .action(callCommand((options) => new RoleListCommand(program).execute(options)));

    program.command('describe <role>')
        .alias('get')
        .description('Describe role grants and users')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--users', 'List users associated with role')
        .option('--no-grants', 'Ignore grants associated with role')
        .action(callCommand((role, options) => new RoleDescribeCommand(program).execute(role, options)));

    program.command('delete <role>')
        .description('Delete a role and remove grants/assignments')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(callCommand((role, options) => new RoleDeleteCommand(program).execute(role, options)));

    program.command('create <role>')
        .description('Create a role with the given grant')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .requiredOption('--project <project>', 'Grant project')
        .requiredOption('--resource <resource>', 'Grant resource')
        .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | *')
        .option('--deny', 'Explicit deny of action(s)')
        .action(callCommand((role, options) => new RoleCreateCommand(program).execute(role, options)));

    program.command('grant <role>')
        .description('Manage grants on an existing role')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .requiredOption('--project <project>', 'Grant project')
        .requiredOption('--resource <resource>', 'Grant resource')
        .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | *')
        .option('--delete', 'Remove grant from role')
        .option('--deny', 'Explicit deny of action(s)')
        .action(callCommand((role, options) => new RoleGrantCommand(program).execute(role, options)));

    program.command('assign <role>')
        .description('Manage a list of user assignments on a role')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .requiredOption('--users <users...>', 'Users to add/remove to/from a role', nonEmptyStringParser({
            message: 'user names must not be empty',
            variadic: true,
        }))
        .option('--delete', 'Unassign users from role')
        .action(callCommand((role, options) => new RoleAssignCommand(program).execute(role, options)));

    program.command('project <project>')
        .description('Manage a list of role assignments on a project')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .requiredOption('--roles <roles...>', 'Roles to add/remove on project')
        .option('--delete', 'Unassign roles from project')
        .action(callCommand((project, options) => new RoleProjectAssignCommand(program).execute(project, options)));

    program.command('list-external')
        .description('List external groups')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(callCommand((options) => new ExternalGroupListCommand(program).execute(options)));

    program.command('describe-external <externalGroup>')
        .alias('get-external')
        .description('Describe external group roles and users')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--users', 'List users associated with external group')
        .option('--roles', 'List roles associated with external group')
        .action(callCommand((externalGroup, options) => new ExternalGroupDescribeCommand(program).execute(externalGroup, options)));

    program.command('delete-external <externalGroup>')
        .description('Delete an external group and remove assignments')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(callCommand((externalGroup, options) => new ExternalGroupDeleteCommand(program).execute(externalGroup, options)));

    program.command('assign-external')
        .description('Manage an external group assignment on a role')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .requiredOption('--role <role>', 'Role to add/remove assignment')
        .requiredOption('--externalGroup <externalGroup>', 'External group to add/remove on role')
        .option('--delete', 'Unassign external group from role')
        .action(callCommand((options) => new ExternalGroupAssignCommand(program).execute(options)));

    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
