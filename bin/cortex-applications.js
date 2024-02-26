#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import process from 'node:process';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
    DEFAULT_LIST_LIMIT_COUNT,
    DEFAULT_LIST_SKIP_COUNT,
    DEFAULT_LIST_SORT_PARAMS,
    GET_DEFAULT_SORT_CLI_OPTION,
    LIST_JSON_HELP_TEXT,
    QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';
import {
    DeleteAppCommand,
    DeployAppCommand,
    DescribeAppCommand,
    ListAppsCommand,
    SaveAppCommand,
    AppLogsCommand,
    UndeployAppCommand,
} from '../src/commands/applications.js';

export function create() {
    const program = new Command();
    program.name('cortex applications');
    program.description('Applications are a mechanism for exposing additional Web UIs and APIS behind Sensa\'s api gateway.  \nNOTE: Applications cannot be added to Agents like normal Skills');
// Deploy Application
    program
        .command('deploy <names...>')
        .description('Deploy the application resource to the cluster')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (names, options) => {
            try {
                await new DeployAppCommand(program).execute(names, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Describe Application
    program
        .command('describe <name>')
        .alias('get')
        .description('Describe application')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-f, --output-file <file>', 'Write output to file instead of stdout')
        .option('-o, --output <pretty|json|yaml>', 'Format output as yaml or k8s resource', 'pretty')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--verbose', 'Verbose output', false)
        .action(withCompatibilityCheck(async (name, options) => {
            try {
                await new DescribeAppCommand(program).execute(name, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// List Applications
    program
        .command('list')
        .description('List applications')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--nostatus', 'skip extra call for application status')
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
        .action(withCompatibilityCheck(async (options) => {
            try {
                await new ListAppsCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Delete Application
    program
        .command('delete <name>')
        .description('Delete an application')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--json', 'Output results using JSON')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (name, options) => {
            try {
                await new DeleteAppCommand(program).execute(name, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Save Application
    program
        .command('save <definitions...>')
        .description('Save application(s)')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-k, --k8sResource <file...>', 'Additional kubernetes resources deployed and owned by the application')
        // eslint-disable-next-line max-len
        .option('--podspec <podspec>', 'A file containing either a JSON or YAML formatted pod spec to merge with the application definition, used for specifying resources (like memory, ephemeral storage, CPUs, and GPUs) and tolerations (like allowing pods to be scheduled on tainted nodes).')
        .option('-y, --yaml', 'Use YAML for application definition format')
        .option('--scaleCount <count>', 'Scale count, only used for daemon action types')
        .action(withCompatibilityCheck(async (definitions, options) => {
            try {
                await new SaveAppCommand(program).execute(definitions, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Undeploy Application
    program
        .command('undeploy <names...>')
        .description('Undeploy the application resource from the cluster')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (names, options) => {
            try {
                return await new UndeployAppCommand(program).execute(names, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
// Get Application logs
    program
        .command('logs <name>')
        .description('Get logs from an application\'s pod')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--raw', 'Get raw logs as a stream')
        .action(withCompatibilityCheck(async (name, options) => {
            try {
                return await new AppLogsCommand(program).execute(name, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
