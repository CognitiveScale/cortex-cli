#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import fs from 'node:fs';
import { Command } from 'commander';
import { checkForEmptyArgs, parseObject, printError } from '../src/commands/utils.js';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, GET_DEFAULT_SORT_CLI_OPTION, DEFAULT_LIST_SORT_PARAMS, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT, 
} from '../src/constants.js';
import {
 ListMissionsCommand, DeployMissionCommand, DescribeMissionCommand, UndeployMissionCommand, 
} from '../src/commands/campaigns.js';
import { InvokeAgentServiceCommand } from '../src/commands/agents.js';
import { DownloadContent } from '../src/commands/content.js';

export function create() {
    const program = new Command();

    program.name('cortex missions');
    program.description('Work with Cortex Missions');
    program
        .command('list <campaignName>')
        .alias('l')
        .description('List Missions of the Campaign')
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
        .action(withCompatibilityCheck((campaignName, options) => {
            try {
                checkForEmptyArgs({ campaignName });
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
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((campaignName, missionName, options) => {
            try {
                checkForEmptyArgs({ campaignName, missionName });
                new DescribeMissionCommand(program).execute(campaignName, missionName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('deploy <campaignName> <missionName>')
        .description('Deploy the selected Missions of the Campaign')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((campaignName, missionName, options) => {
            try {
                checkForEmptyArgs({ campaignName, missionName });
                new DeployMissionCommand(program).execute(campaignName, missionName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('invoke <campaignName> <missionName>')
        .description('Invoke the mission')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--params <params>', 'JSON params to send to the action')
        .option('--params-file <paramsFile>', 'A file containing either JSON or YAML formatted params')
        .action(withCompatibilityCheck((campaignName, missionName, options) => {
            checkForEmptyArgs({ campaignName, missionName });
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
                new InvokeAgentServiceCommand(program).execute(`${campaignName}-${missionName}`, 'mission_manager_service', options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('undeploy <campaignName> <missionName>')
        .description('Undeploy the selected Missions of the Campaign')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((campaignName, missionName, options) => {
            try {
                checkForEmptyArgs({ campaignName, missionName });
                new UndeployMissionCommand(program).execute(campaignName, missionName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('status <activationId>')
        .description('Status of Missions activation')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((activationId, options) => {
            try {
                checkForEmptyArgs({ activationId });
                new DownloadContent(program).execute(`mission_runtime/${activationId}/status.chk`, options);
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
