#!/usr/bin/env node
import esMain from 'es-main';
import { Command } from 'commander';
import { callCommand } from '../src/compatibility.js';
import {
 ListActionsCommand, DescribeActionCommand, DeleteActionCommand, DeployActionCommand, 
} from '../src/commands/actions.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SORT_PARAMS, GET_DEFAULT_SORT_CLI_OPTION, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT, 
} from '../src/constants.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.name('cortex actions');
    program.description('Work with Cortex Actions');
// List Actions
    program
        .command('list')
        .description('List the deployed actions')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
        .action(callCommand((options) => {
                new ListActionsCommand(program).execute(options);
        }));
// Describe Action
    program
        .command('describe <actionName>')
        .alias('get')
        .description('Describe an action')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('-d, --download', 'Download code binary in response')
        .action(callCommand((actionName, options) => {
                checkForEmptyArgs({ actionName });
                new DescribeActionCommand(program).execute(actionName, options);
        }));
// Delete Action
    program
        .command('delete <actionName>')
        .description('Delete an action')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((actionName, options) => {
                checkForEmptyArgs({ actionName });
                new DeleteActionCommand(program).execute(actionName, options);
        }));
// Deploy Action
    program
        .command('deploy [actionDefinition]')
        .alias('save')
        .description('Deploy an action')
        .storeOptionsAsProperties(false)
        .option('--name, --actionName <name>', 'Action name')
        .option('--type, --actionType <job|daemon>', 'Type of action')
        .option('--cmd <cmd>', 'Command to be executed') // '<"--daemon">'
        .option('--image, --docker <name[:tag]>', 'Docker image to use as the runner')
        .option('--environmentVariables <environmentVariables>', 'Docker container environment variables, only used for daemon action types')
        .option('--jobTimeout <jobTimeout>', 'Job Timeout in seconds until the job is marked as FAILED (default: no timeout), only used for job action types')
        .option('-k, --k8sResource <file...>', 'Additional kubernetes resources deployed and owned by the skill, provide as last option specified or end list of files with "--"')
        .option('--no-compat', 'Ignore API compatibility checks')
        // eslint-disable-next-line max-len
        .option('--podspec <podspec>', 'A file containing either a JSON or YAML formatted pod spec to merge with the action definition, used for specifying resources (like memory, ephemeral storage, CPUs, and GPUs) and tolerations (like allowing pods to be scheduled on tainted nodes).')
        .option('--port <port>', 'Docker port, only used for daemon action types') // '9091'
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--scaleCount <count>', 'Scale count, only used for daemon action types')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        // TODO this command is non-functional, comment for now to avoid confusion
        // .option('--push-docker', 'Push Docker image to the Cortex registry.')
        .option('-y, --yaml', 'Use YAML format')
        .action(callCommand((actionName, options) => {
                new DeployActionCommand(program).execute(actionName, options);
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
