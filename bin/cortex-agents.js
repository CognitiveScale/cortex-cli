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
const { program } = require('commander');

const { withCompatibilityCheck } = require('../src/compatibility');
const {
    DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SORT_PARAMS,
    GET_DEFAULT_SORT_CLI_OPTION,
} = require('../src/constants');

const {
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
} = require('../src/commands/agents');

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
    .action(withCompatibilityCheck((agentDefinitions, options) => {
        try {
            new SaveAgentCommand(program).execute(agentDefinitions, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Agents
program
    .command('list')
    .description('List agent definitions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
    .action(withCompatibilityCheck((options) => {
        try {
            new ListAgentsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Deploy agent
program
    .command('deploy <agentNames...>')
    .description('Deploy the agent resource to the cluster')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck((agentNames, options) => {
        try {
            new DeployAgentCommand(program).execute(agentNames, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Agent
program
    .command('describe <agentName>')
    .description('Describe agent')
    .alias('get')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .option('--versions', 'To get list of versions of an agent')
    .option('--verbose', 'Verbose output')
    .action(withCompatibilityCheck((agentName, options) => {
        try {
            new DescribeAgentCommand(program).execute(agentName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Invoke Agent Service
program
    .command('invoke <agentName> <serviceName>')
    .description('Invoke an agent service')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--params <params>', 'JSON params to send to the action')
    .option('--params-file <paramsFile>', 'A file containing either JSON or YAML formatted params')
    .option('--scheduleName <name>', 'Identifier to uniquely identify an agents schedule, defaults to the agent\'s name')
    .option('--scheduleCron <cron>', 'Schedule agent invoke periodically using a cron schedule string for example: "0 0 * * *", @hourly, or @daily')
    .option('--sync', 'Invoke the agent synchronously')
    .action(withCompatibilityCheck((agentName, serviceName, options) => {
        try {
            new InvokeAgentServiceCommand(program).execute(agentName, serviceName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Agent
program
    .command('delete <agentName>')
    .description('Delete an agent')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck((agentName, options) => {
        try {
            new DeleteAgentCommand(program).execute(agentName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Undeploy agent
program
    .command('undeploy <agentNames...>')
    .description('Undeploy the agent resource from the cluster')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .action(withCompatibilityCheck((agentNames, options) => {
        try {
            new UndeployAgentCommand(program).execute(agentNames, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get activation
program
    .command('get-activation <activationId>')
    .description('Get dataset or service activation')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--json', 'Output results as JSON')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--verbose [boolean]', 'Get debugging info in activation response')
    .option('--report [boolean]', 'Get additional debugging info in activation response')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((activationId, options) => {
        try {
            new GetActivationCommand(program).execute(activationId, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List activations
program
    .command('list-activations')
    .description('List activations for an agent')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
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
    .option('--sort <asc|desc>', 'Sort the activations by start timestamp ascending (asc) or descending (desc) or as mongo query', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.start))
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListActivationsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

    program
    .command('list-services <agentName>')
    .description('List agent service endpoints')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .option('--skip <skip>', 'Move the result cursor to this position before returning results.')
    .option('--limit <limit>', 'Limit the number of rows returned')
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.')

        .action(withCompatibilityCheck((agentName, options) => {
        try {
            new ListServicesCommand(program).execute(agentName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
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
    .action(withCompatibilityCheck((snapshotDefinition, options) => {
        try {
            new CreateAgentSnapshotCommand(program).execute(snapshotDefinition, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('list-snapshots <agentName>')
    .description('List agent snapshots')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
    .option('--profile <profile>', 'The profile to use')
    .option('--project <project>', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query <query>', 'A JMESPath query to use in filtering the response data.')
    .option('--filter <filter>', 'A Mongo style filter to use.')
    .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS._updatedAt))
    .action(withCompatibilityCheck((agentName, options) => {
        try {
            new ListAgentSnapshotsCommand(program).execute(agentName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
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
    .action(withCompatibilityCheck((snapshotId, options) => {
        try {
            new DescribeAgentSnapshotCommand(program).execute(snapshotId, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
