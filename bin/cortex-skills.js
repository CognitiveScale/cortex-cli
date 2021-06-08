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
    SaveSkillCommand,
    ListSkillsCommand,
    DescribeSkillCommand,
    InvokeSkillCommand,
    DeploySkillCommand,
    UndeploySkillCommand,
    SkillLogsCommand,
} = require('../src/commands/skills');

program.description('Work with Cortex Skills');

// Deploy Skill
program
    .command('deploy <skillName>')
    .description('Deploy the skill resource to the cluster')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((skillName, options) => {
        try {
            new DeploySkillCommand(program).execute(skillName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Skill
program
    .command('describe <skillName>')
    .alias('get')
    .description('Describe skill')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--verbose', 'Verbose output')
    .action(withCompatibilityCheck((skillName, options) => {
        try {
            new DescribeSkillCommand(program).execute(skillName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Invoke Skill
program
    .command('invoke <skillName> <inputName>')
    .description('Invoke a skill')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--params [params]', 'JSON params to send to the action')
    .option('--params-file [paramsFile]', 'A file containing either JSON or YAML formatted params')
    .action(withCompatibilityCheck((skillName, inputName, options) => {
        try {
            new InvokeSkillCommand(program).execute(skillName, inputName, options);
        } catch (err) {
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
    .option('--no-status', 'skip extra call for skill status')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListSkillsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

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
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Undeploy Skill
program
    .command('undeploy <skillName>')
    .description('Undeploy the skill resource from the cluster')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((skillName, options) => {
        try {
            new UndeploySkillCommand(program).execute(skillName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get Skill/action logs
program
    .command('logs <skillName> <actionName>')
    .description('Get logs of a skill and action')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    // TODO enable when we want to support tasks
    // .option('--type [type]', 'The type of action logs to fetch [skill|task]')
    .action(withCompatibilityCheck((skillName, actionName, options) => {
        try {
            new SkillLogsCommand(program).execute(skillName, actionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
