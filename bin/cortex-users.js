#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { callCommand } from '../src/compatibility.js';
import {
 UserProjectAssignCommand, UserDescribeCommand, UserGrantCommand, UserCreateCommand, UserListCommand, UserDeleteCommand, UserResetPATCommand, UserGetPATCommand,
} from '../src/commands/users.js';
import { LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT } from '../src/constants.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();

    program.name('cortex users');
    program.description('Work with Cortex User');
    program.command('describe [user]')
        .alias('get')
        .description('Describe a users grants and roles')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--user <user>', 'The user to describe, self for default')
        .option('--roles', 'Include grant inheritance from roles')
        .action(callCommand(async (user, options) => {
                await new UserDescribeCommand(program).execute(user, options);
        }));
    program.command('grant <user>')
        .description('Manage user grants')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .requiredOption('--project <project>', 'Grant project')
        .requiredOption('--resource <resource>', 'Grant resource')
        .requiredOption('--actions <actions...>', 'Grant actions read | write | execute | *')
        .option('--profile <profile>', 'The profile to use')
        .option('--delete', 'Remove grant from user')
        .option('--deny', 'Explicit deny of action(s)')
        .action(callCommand((user, options) => {
                checkForEmptyArgs({ user });
                new UserGrantCommand(program).execute(user, options);
        }));
    program.command('project <project>')
        .description('Manage a list of user assignments on a project')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .requiredOption('--users <users...>', 'Users to add/remove on project')
        .option('--delete', 'Unassign users from project')
        .action(callCommand((project, options) => {
                checkForEmptyArgs({ project });
                new UserProjectAssignCommand(program).execute(project, options);
        }));
    program.command('delete <user>')
        .description('Deletes a service user and disables any existing tokens created by the user')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(callCommand((user, options) => {
                checkForEmptyArgs({ user });
                new UserDeleteCommand(program).execute(user, options);
        }));
    program.command('create <user>')
        .description('Creates a service user (with no assigned roles/grants) that can authenticate with and call Fabric API\'s')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(callCommand((user, options) => {
                checkForEmptyArgs({ user });
                new UserCreateCommand(program).execute(user, options);
        }));
    program.command('list')
        .description('Lists all service users created within Cortex')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(callCommand((options) => {
                new UserListCommand(program).execute(options);
        }));
    program.command('reset-pat')
        .description('Invalidates personal access token (PAT) for a specified user within Cortex')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--user <user>', 'The user to reset personal access token')
        .action(callCommand((options) => {
                new UserResetPATCommand(program).execute(options);
        }));
    program.command('get-pat')
        .description('Fetch personal access token (PAT) for a specified user within Cortex')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--user <user>', 'The user to reset personal access token (admins only)')
        .action(callCommand((options) => {
                new UserGetPATCommand(program).execute(options);
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
