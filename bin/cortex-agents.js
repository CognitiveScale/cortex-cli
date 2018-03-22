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

const program = require('commander');
const chalk = require('chalk');
const {
    SaveAgentCommand,
    ListAgentsCommand,
    DescribeAgentCommand,
    InvokeAgentServiceCommand,
    GetServiceActivationCommand,
    ListAgentInstancesCommand,
    CreateAgentInstanceCommand,
    GetAgentInstanceCommand,
    DeleteAgentInstanceCommand,
    StopAgentInstanceCommand,
    ListTriggersCommand,
    GetAgentSnapshotCommand,
    CreateAgentSnapshotCommand
} = require('../src/commands/agents');

let processed = false;
program.description('Work with Cortex Agents');

// Save Agent
program
    .command('save <agentDefinition>')
    .description('Save an agent definition')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for agent definition format')
    .action((agentDefinition, options) => {
        try {
            new SaveAgentCommand(program).execute(agentDefinition, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// List Agents
program
    .command('list')
    .description('List agent definitions')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action((options) => {
        try {
            new ListAgentsCommand(program).execute(options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Describe Agent
program
    .command('describe <agentName>')
    .description('Describe agent')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--versions', 'To get list of versions of an agent')
    .action((agentName, options) => {
        try {
            new DescribeAgentCommand(program).execute(agentName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Invoke Agent Service
program
    .command('invoke <agentName> <serviceName>')
    .description('Invoke an agent service')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .action((agentName, serviceName, options) => {
        try {
            new InvokeAgentServiceCommand(program).execute(agentName, serviceName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//Get Agent Service Activation
program
    .command('get-service-activation <activationId>')
    .description('Get service activation')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action((activationId, options) => {
        try {
            new GetServiceActivationCommand(program).execute(activationId, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//Get Agent Snapshots
program
    .command('get-snapshots <agentName>')
    .description('Get agent snapshots')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((agentName, options) => {
        try {
            new GetAgentSnapshotCommand(program).execute(agentName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//Create Agent Snapshot
program
    .command('create-snapshot <snapshotDefinition>')
    .description('Create agent snapshot with JSON file as input')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((snapshotDefinition, options) => {
        try {
            new CreateAgentSnapshotCommand(program).execute(snapshotDefinition, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//List agent instances
program
    .command('list-instances <agentName>')
    .description('List agent instances  ')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((agentName, options) => {
        try {
            new ListAgentInstancesCommand(program).execute(agentName, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//Create agent instances
program
    .command('create-instance <instanceDefinition>')
    .description('Create agent instance')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((instanceDefinition, options) => {
        try {
            new CreateAgentInstanceCommand(program).execute(instanceDefinition, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//Get agent instance
program
    .command('get-instance <instanceId>')
    .description('Get agent instance')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action((instanceId, options) => {
        try {
            new GetAgentInstanceCommand(program).execute(instanceId, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//Delete agent instance
program
    .command('delete-instance <instanceId>')
    .description('Delete agent instance')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((instanceId, options) => {
        try {
            new DeleteAgentInstanceCommand(program).execute(instanceId, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//Stop agent instance
program
    .command('stop-instance <instanceId>')
    .description('Stop agent instance')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((instanceId, options) => {
        try {
            new StopAgentInstanceCommand(program).execute(instanceId, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

//List triggers
program
    .command('list-triggers')
    .description('List of triggers for the current tenant')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((options) => {
        try {
            new ListTriggersCommand(program).execute(options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });


process.env.DOC && require('../src/commands/utils').exportDoc(program);

program.parse(process.argv);
if (!processed)
    ['string', 'undefined'].includes(typeof program.args[0]) && program.help();