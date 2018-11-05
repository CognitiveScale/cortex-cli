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

const chalk = require('chalk');
const program = require('../src/commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    SaveAgentCommand,
    ListAgentsCommand,
    DescribeAgentCommand,
    InvokeAgentServiceCommand,
    GetActivationCommand,
    ListActivationsCommand,
    ListAgentInstancesCommand,
    CreateAgentInstanceCommand,
    GetAgentInstanceCommand,
    DeleteAgentInstanceCommand,
    StopAgentInstanceCommand,
    ListTriggersCommand,
    ListServicesCommand,
    ListAgentSnapshotsCommand,
    DescribeAgentSnapshotCommand,
    CreateAgentSnapshotCommand
} = require('../src/commands/agents');

const { printError } = require('../src/commands/utils');

program.description('Work with Cortex Agents');

// Save Agent
program
    .command('save <agentDefinition>')
    .description('Save an agent definition')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for agent definition format')
    .action(withCompatibilityCheck((agentDefinition, options) => {
        try {
            new SaveAgentCommand(program).execute(agentDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Agents
program
    .command('list')
    .description('List agent definitions')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListAgentsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Agent
program
    .command('describe <agentName>')
    .description('Describe agent')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--versions', 'To get list of versions of an agent')
    .action(withCompatibilityCheck((agentName, options) => {
        try {
            new DescribeAgentCommand(program).execute(agentName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Invoke Agent Service
program
    .command('invoke <agentName> <serviceName>')
    .description('Invoke an agent service')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .action(withCompatibilityCheck((agentName, serviceName, options) => {
        try {
            new InvokeAgentServiceCommand(program).execute(agentName, serviceName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

//Get Agent Service Activation
program
    .command('get-service-activation <activationId>')
    .description('Get service activation')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(() => {
        printError('DEPRECATED.  Use get-activation instead.');
    });

program
    .command('get-activation <activationId>')
    .description('Get dataset or service activation')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((activationId, options) => {
        try {
            new GetActivationCommand(program).execute(activationId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('list-activations <instanceId>')
    .description('List agent instance activations')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--environmentName [environmentName]', 'The environment to list or \'all\'')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((instanceId, options) => {
        try {
            new ListActivationsCommand(program).execute(instanceId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


    program
    .command('list-services <agentName>')
    .description('List agent service endpoints')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--environmentName [environmentName]', 'The environment to list or \'all\'')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((agentName, options) => {
        try {
            new ListServicesCommand(program).execute(agentName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
            
        }
    }));

program
    .command('list-snapshots <agentName>')
    .description('List agent snapshots')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--environmentName [environmentName]', 'The environment to list or \'all\'')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((agentName, options) => {
        try {
            new ListAgentSnapshotsCommand(program).execute(agentName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('describe-snapshot <snapshotId>')
    .description('Describe agent snapshot')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--environmentName [environmentName]', 'The environment to list or \'all\'')
    .action(withCompatibilityCheck((snapshotId, options) => {
        try {
            new DescribeAgentSnapshotCommand(program).execute(snapshotId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

//Create Agent Snapshot
program
    .command('create-snapshot [snapshotDefinition]')
    .description('Create an agent snapshot')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--agentName [name[:version]]', 'The name of the agent to snapshot')
    .option('--title [title]', 'A descriptive title for the snapshot')
    .action(withCompatibilityCheck((snapshotDefinition, options) => {
        try {
            new CreateAgentSnapshotCommand(program).execute(snapshotDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


//List agent instances
program
    .command('list-instances <agentName>')
    .description('List agent instances  ')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--environmentName [environmentName]', 'The environment to list or \'all\'')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((agentName, options) => {
        try {
            new ListAgentInstancesCommand(program).execute(agentName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

//Create agent instances
program
    .command('create-instance [instanceDefinition]')
    .description('Create agent instance')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--environmentName [environmentName]', 'The environment to use')
    .option('--profile [profile]', 'The profile to use')
    .option('--snapshotId [snapshotId]', 'The name of the agent to snapshot')
    .action(withCompatibilityCheck((instanceDefinition, options) => {
        try {
            new CreateAgentInstanceCommand(program).execute(instanceDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

//Get agent instance
program
    .command('get-instance <instanceId>')
    .description('Get agent instance')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((instanceId, options) => {
        try {
            new GetAgentInstanceCommand(program).execute(instanceId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

//Delete agent instance
program
    .command('delete-instance <instanceId>')
    .description('Delete agent instance')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((instanceId, options) => {
        try {
            new DeleteAgentInstanceCommand(program).execute(instanceId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

//Stop agent instance
program
    .command('stop-instance <instanceId>')
    .description('Stop agent instance')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((instanceId, options) => {
        try {
            new StopAgentInstanceCommand(program).execute(instanceId, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

//List triggers
program
    .command('list-triggers')
    .description('List of triggers for the current tenant')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListTriggersCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


program.parse(process.argv);