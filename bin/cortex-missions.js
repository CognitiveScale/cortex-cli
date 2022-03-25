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
const fs = require('fs');
const program = require('commander');
const { parseObject, printError } = require('../src/commands/utils');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    ListMissionsCommand,
    DeployMissionCommand,
    DescribeMissionCommand,
    UndeployMissionCommand,
} = require('../src/commands/campaigns');

const { InvokeAgentServiceCommand } = require('../src/commands/agents');

program.name('cortex missions');
program.description('Work with Cortex Missions');

program
    .command('list <campaignName>')
    .alias('l')
    .description('List Missions of the Campaign')
    .option('--json', 'Output results using JSON')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .option('--skip [skip]', 'Move the result cursor to this position before returning results.')
    .option('--limit [limit]', 'Limit the number of rows returned')
    .option('--filter [filter]', 'A Mongo style filter to use.')
    .option('--sort [sort]', 'A Mongo style sort statement to use in the query.')
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
    .action(withCompatibilityCheck((campaignName, missionName, options) => {
        try {
            let params = {};
            if (options.params) {
                try {
                    params = parseObject(options.params, options);
                } catch (e) {
                    printError(`Failed to parse params: ${options.params} Error: ${e}`, options);
                }
            } else if (options.paramsFile) {
                const paramsStr = fs.readFileSync(options.paramsFile);
                params = parseObject(paramsStr, options);
            }
            if (params.payload) {
                // apply validations
                if (!params.payload.campaign_name || !params.payload.mission_name || !params.payload.profile_schema) {
                    printError('payload must contain campaign_name, mission_name and profile_schema');
                    throw new Error('Payload must contain campaign_name, mission_name and profile_schema');
                }
                // batch size can't be empty, can't be negative
                if (!params.payload.batch_size || params.payload.batch_size <= 0) {
                    printError(`batch_size cannot be "${params.payload.batch_size}"`);
                    throw new Error('Inappropriate Batch Size passed in params');
                }
            } else {
                printError('payload cannot be empty');
                throw new Error('Empty payload received in params');
            }
            new InvokeAgentServiceCommand(program).execute(`${missionName}-online-learner-agent`, 'online_learner_service', options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('undeploy <campaignName> <missionName>')
    .description('Undeploy the selected Missions of the Campaign')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((campaignName, missionName, options) => {
        try {
            new UndeployMissionCommand(program).execute(campaignName, missionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
