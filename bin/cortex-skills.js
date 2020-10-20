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
    SaveSkillCommand,
    ListSkillsCommand,
    DescribeSkillCommand,
    GenerateSkillCommand
} = require('../src/commands/skills');

program.description('Work with Cortex Skills');

// Save Skill
program
    .command('save <skillDefinition>')
    .description('Save a skill definition')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('-y, --yaml', 'Use YAML for skill definition format')
    .action(withCompatibilityCheck((skillDefinition, options) => {
        try {
            new SaveSkillCommand(program).execute(skillDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Skills
program
    .command('list')
    .description('List skill definitions')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListSkillsCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Skill
program
    .command('describe <skillName>')
    .description('Describe skill')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((skillName, options) => {
        try {
            new DescribeSkillCommand(program).execute(skillName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('generate')
    .description('(Deprecated) Generates the structure and top level build script for a skill')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .action((options) => { // deliberately not using withCompatibilityCheck()
        try {
            new GenerateSkillCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);
