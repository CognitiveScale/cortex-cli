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
const program = require('../src/commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    ListMissionsCommand,
    DeployMissionCommand,
    DescribeMissionCommand,
} = require('../src/commands/campaigns');

const { InvokeAgentServiceCommand } = require('../src/commands/agents');

program.description('Work with Cortex Missions');

program
    .command('list <campaignName>')
    .description('List Missions of the Campaign')
    .option('--json', 'Output results using JSON')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((campaignName, options) => {
        try {
            new ListMissionsCommand(program).execute(campaignName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('describe <campaignName> <missionName>')
    .alias('get')
    .description('Describe the selected Missions of the Campaign')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((campaignName, missionName, options) => {
        try {
            new DescribeMissionCommand(program).execute(campaignName, missionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('deploy <campaignName> <missionName>')
    .description('Deploy the selected Missions of the Campaign')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((campaignName, missionName, options) => {
        try {
            new DeployMissionCommand(program).execute(campaignName, missionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('invoke <campaignName> <missionName>')
    .description('Invoke the mission')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .action(withCompatibilityCheck((missionName, options) => {
        try {
            new InvokeAgentServiceCommand(program).execute(missionName, 'router_service', options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
