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
const program = require('commander');

const { withCompatibilityCheck } = require('../src/compatibility');

const {
    ListCampaignsCommand,
    DescribeCampaignCommand,
    ExportCampaignCommand,
    ImportCampaignCommand,
    DeployCampaignCommand,
    UndeployCampaignCommand,
} = require('../src/commands/campaigns');

program.description('Work with Cortex Campaigns');

// List Campaigns
program
    .command('list')
    .description('List Campaigns')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
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
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((campaignName, options) => {
        try {
            new DescribeCampaignCommand(program).execute(campaignName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('export <campaignName>')
    .description('Export Campaign Archive')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--deployable [boolean]', 'Export only deployable missions', true)
    .option('--o [output]', 'Export file name')
    .action(withCompatibilityCheck((campaignName, options) => {
        try {
            new ExportCampaignCommand(program).execute(campaignName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('import <campaignExportFilepath>')
    .description('Import Campaign Archive')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
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
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((campaignName, options) => {
        try {
            new DeployCampaignCommand(program).execute(campaignName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('undeploy <campaignName>')
    .description('Undeploy Campaign')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((campaignName, options) => {
        try {
            new UndeployCampaignCommand(program).execute(campaignName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.showHelpAfterError().parseAsync(process.argv);
