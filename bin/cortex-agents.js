#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { callCommand } from '../src/compatibility.js';
import {
    DEFAULT_LIST_LIMIT_COUNT,
    DEFAULT_LIST_SKIP_COUNT,
    DEFAULT_LIST_SORT_PARAMS,
    GET_DEFAULT_SORT_CLI_OPTION,
    LIST_JSON_HELP_TEXT,
    QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';
import {
    CreateAgentSnapshotCommand,
    DeleteAgentCommand,
    DeployAgentCommand,
    DescribeAgentCommand,
    DescribeAgentSnapshotCommand,
    GetActivationCommand,
    InvokeAgentServiceCommand,
    ListActivationsCommand,
    ListAgentSnapshotsCommand,
    ListAgentsCommand,
    ListServicesCommand,
    SaveAgentCommand,
    UndeployAgentCommand,
    CancelActivationCommand,
} from '../src/commands/agents.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.name('cortex agents');
    program.description('Work with Cortex Agents');
// Save Agent
    program
        .command('save <agentDefinitions...>')
        .description('Save an agent definition')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for agent definition format')
        .action(callCommand(
            (agentDefinitions, options) => new SaveAgentCommand(program).execute(agentDefinitions, options)
        ));
// List Agents
    program
        .command('list')
        .description('List agent definitions')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
        .action(callCommand((options) => {
            new ListAgentsCommand(program).execute(options);
        }));
// Deploy agent
    program
        .command('deploy <agentNames...>')
        .description('Deploy the agent resource to the cluster')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((agentNames, options) => {
                checkForEmptyArgs({ agentNames });
                new DeployAgentCommand(program).execute(agentNames, options);
        }));
// Describe Agent
    program
        .command('describe <agentName>')
        .description('Describe agent')
        .alias('get')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('-f --output-file <file>', 'Write output to file instead of stdout')
        .option('-o, --output <json|yaml|openapi>', 'Format output as yaml or k8s resource', 'json')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--versions', 'To get list of versions of an agent')
        .option('--verbose', 'Verbose output', false)
        .action(callCommand((agentName, options) => {
                checkForEmptyArgs({ agentName });
                new DescribeAgentCommand(program).execute(agentName, options);
        }));
// Invoke Agent Service
    program
        .command('invoke <agentName> <serviceName>')
        .description('Invoke an agent service')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', true)
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--params <params>', 'JSON params to send to the action')
        .option('--params-file <paramsFile>', 'A file containing either JSON or YAML formatted params')
        .option('--scheduleName <name>', 'Identifier to uniquely identify an agents schedule, defaults to the agent\'s name')
        .option('--scheduleCron <cron>', 'Schedule agent invoke periodically using a cron schedule string for example: "0 0 * * *", @hourly, or @daily')
        .option('--sync', 'Invoke the agent synchronously', false)
        .action(callCommand((agentName, serviceName, options) => {
                checkForEmptyArgs({ agentName, serviceName });
                new InvokeAgentServiceCommand(program).execute(agentName, serviceName, options);
        }));
// Delete Agent
    program
        .command('delete <agentName>')
        .description('Delete an agent')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((agentName, options) => {
                checkForEmptyArgs({ agentName });
                new DeleteAgentCommand(program).execute(agentName, options);
        }));
// Undeploy agent
    program
        .command('undeploy <agentNames...>')
        .description('Undeploy the agent resource from the cluster')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((agentNames, options) => {
                checkForEmptyArgs({ agentNames });
                new UndeployAgentCommand(program).execute(agentNames, options);
        }));
// Get activation
    program
        .command('get-activation <activationId>')
        .description('Get dataset or service activation')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--verbose [boolean]', 'Get debugging info in activation response')
        .option('--report [boolean]', 'Get additional debugging info in activation response')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(callCommand((activationId, options) => {
                checkForEmptyArgs({ activationId });
                new GetActivationCommand(program).execute(activationId, options);
        }));
// Cancel activation
    program
        .command('cancel-activation <activationId>')
        .description('Cancel pending/running activation')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--inFlight [boolean]', 'Leave inflight jobs running', false)
        .action(callCommand((activationId, options) => {
                checkForEmptyArgs({ activationId });
                new CancelActivationCommand(program).execute(activationId, options);
        }));

// List activations
    program
        .command('list-activations')
        .description('List activations for an agent')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--agentName <string>', 'Query activations by agentName')
        .option('--skillName <string>', 'Query activations by skillName')
        .option('--startBefore <timestamp>', 'Filters activations to include those that started before the specified timestamp.')
        .option('--startAfter <timestamp>', 'Filters activations to include those that started after the specified timestamp.')
        .option('--endBefore <timestamp>', 'Filters activations to include those that ended before the specified timestamp.')
        .option('--endAfter <timestamp>', 'Filters activations to include those that ended after the specified timestamp.')
        .option('--correlationId <string>', 'Query activations with same correlationId')
        .option('--status <status>', 'Filters activations by status [complete|error].')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        // eslint-disable-next-line max-len
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.start))
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .action(callCommand((options) => {
                new ListActivationsCommand(program).execute(options);
        }));
    program
        .command('list-services <agentName>')
        .description('List agent service endpoints')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(callCommand((agentName, options) => {
                checkForEmptyArgs({ agentName });
                new ListServicesCommand(program).execute(agentName, options);
        }));
// Create Agent Snapshot
    program
        .command('create-snapshot [snapshotDefinition]')
        .description('Create an agent snapshot')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--agentName <name[:version]>', 'The name of the agent to snapshot')
        .option('--title <title>', 'A descriptive title for the snapshot')
        .action(callCommand((snapshotDefinition, options) => {
                new CreateAgentSnapshotCommand(program).execute(snapshotDefinition, options);
        }));
    program
        .command('list-snapshots <agentName>')
        .description('List agent snapshots')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS._updatedAt))
        .action(callCommand((agentName, options) => {
                checkForEmptyArgs({ agentName });
                new ListAgentSnapshotsCommand(program).execute(agentName, options);
        }));
    program
        .command('describe-snapshot <snapshotId>')
        .alias('get-snapshot')
        .description('Describe agent snapshot')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-o, --output <json|yaml|k8s>', 'Format output as yaml or k8s resources')
        .action(callCommand((snapshotId, options) => {
                checkForEmptyArgs({ snapshotId });
                new DescribeAgentSnapshotCommand(program).execute(snapshotId, options);
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
