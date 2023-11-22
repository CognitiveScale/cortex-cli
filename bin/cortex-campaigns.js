#!/usr/bin/env node
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, GET_DEFAULT_SORT_CLI_OPTION, DEFAULT_LIST_SORT_PARAMS, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT, 
} from '../src/constants.js';
import {
 ListCampaignsCommand, DescribeCampaignCommand, ExportCampaignCommand, ImportCampaignCommand, DeployCampaignCommand, UndeployCampaignCommand, 
} from '../src/commands/campaigns.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.name('cortex campaigns');
    program.description('Work with Cortex Campaigns');
// List Campaigns
    program
        .command('list')
        .description('List Campaigns')
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
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS._updatedAt))
        .action(withCompatibilityCheck((options) => {
            try {
                new ListCampaignsCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Get|Describe Campaign
    program
        .command('describe <campaignName>')
        .alias('get')
        .description('Describe Campaign')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck((campaignName, options) => {
            try {
                checkForEmptyArgs({ campaignName });
                new DescribeCampaignCommand(program).execute(campaignName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('export <campaignName>')
        .description('Export Campaign Archive')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--deployable [boolean]', 'Export only deployable missions', true)
        .option('--o <output>', 'Export file name')
        .action(withCompatibilityCheck(async (campaignName, options) => {
            try {
                checkForEmptyArgs({ campaignName });
                await new ExportCampaignCommand(program).execute(campaignName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('import <campaignExportFilepath>')
        .description('Import Campaign Archive')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--deploy [boolean]', 'Set missions status Ready To Deploy', true)
        .option('--overwrite [boolean]', 'Overwrite existing deployed missions with the imported one', false)
        .action(withCompatibilityCheck((campaignName, options) => {
            try {
                new ImportCampaignCommand(program).execute(campaignName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('deploy <campaignName>')
        .description('Deploy Campaign')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((campaignName, options) => {
            try {
                checkForEmptyArgs({ campaignName });
                new DeployCampaignCommand(program).execute(campaignName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('undeploy <campaignName>')
        .description('Undeploy Campaign')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((campaignName, options) => {
            try {
                checkForEmptyArgs({ campaignName });
                new UndeployCampaignCommand(program).execute(campaignName, options);
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
