import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 ListTasksCommand, DescribeTaskCommand, TaskLogsCommand, TaskDeleteCommand, TaskPauseCommand, TaskResumeCommand, 
} from '../src/commands/tasks.js';
import {
 DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SKIP_COUNT, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT, DEFAULT_LIST_SORT_PARAMS, GET_DEFAULT_SORT_CLI_OPTION, 
} from '../src/constants.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.name('cortex tasks');
    program.description('Work with Cortex Tasks');
// List tasks
    program
        .command('list')
        .description('List tasks')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--scheduled', 'Show scheduled tasks only')
        // TODO Should we remove and just use filter {}
        .option('--actionName <string>', 'Filter tasks by action name')
        .option('--activationId <string>', 'filter tasks by activation id')
        .option('--agentName <string>', 'Filter tasks by agent name')
        .option('--skillName <string>', 'Filter tasks by skill name')
        .option('--username <string>', 'Filter tasks by username')
        .option('--skillName <string>', 'Filter tasks by skill name')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        // This is a client-side sort
        .option('--filter <filter>', 'Filter by actionName, activationId, agentName, or skillName only equality is supported')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.startTime))
        .action(withCompatibilityCheck(async (options) => {
            try {
                await new ListTasksCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('describe <taskName>')
        .alias('get')
        .description('Describe a task')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--k8s', 'Return the full k8sResource in the response')
        // .option('-o, --output <json|yaml|k8s>', 'Format output as yaml or k8s resources')
        .action(withCompatibilityCheck((taskName, options) => {
            try {
                checkForEmptyArgs([taskName]);
                new DescribeTaskCommand(program).execute(taskName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Get task logs
    program
        .command('logs <taskName>')
        .description('Get logs of a task')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        // TODO enable when we want to support tasks
        // .option('--type [type]', 'The type of action logs to fetch [skill|task]')
        .action(withCompatibilityCheck((taskName, options) => {
            try {
                new TaskLogsCommand(program).execute(taskName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Delete a task
    program
        .command('delete <taskName...>')
        .description('Delete a task, if it exists')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (taskName, options) => {
            try {
                checkForEmptyArgs([taskName]);
                await new TaskDeleteCommand(program).execute(taskName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Pause a task
    program
        .command('pauseSchedule <taskNames...>')
        .description('Pause scheduling for a scheduled task')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (taskName, options) => {
            try {
                await new TaskPauseCommand(program).execute(taskName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Resume a task
    program
        .command('resumeSchedule <taskNames...>')
        .description('Resume paused schedule for a scheduled task')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (taskName, options) => {
            try {
                await new TaskResumeCommand(program).execute(taskName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
