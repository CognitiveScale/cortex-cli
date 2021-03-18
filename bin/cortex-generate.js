#!/usr/bin/env node
/*
 * Copyright 2021 Cognitive Scale, Inc. All Rights Reserved.
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
    GenerateSkillCommand,
    GenerateCampaignCommand,

} = require('../src/commands/generate');

program.description('Scaffolding Cortex Components');

program
    .command('skill')
    .description('Generates the structure and top level build script for a skill in current directory')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--path [path]', 'Target folder', '.')
    .action(withCompatibilityCheck((options) => {
        try {
            new GenerateSkillCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('generate <CampaignName>')
    .description('Import Campaign Archive')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--path [path]', 'Target folder', '.')
    .option('--overwrite [boolean]', 'Overwrite existing ', false)
    .action(withCompatibilityCheck((campaignName, options) => {
        try {
            new GenerateCampaignCommand(program).execute(campaignName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
