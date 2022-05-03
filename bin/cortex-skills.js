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
const { DEFAULT_LIST_SKIP_COUNT, DEFAULT_LIST_LIMIT_COUNT, DEFAULT_LIST_SORT_PARAMS } = require('../src/constants');

const {
    SaveSkillCommand,
    ListSkillsCommand,
    DescribeSkillCommand,
    InvokeSkillCommand,
    DeploySkillCommand,
    UndeploySkillCommand,
    SkillLogsCommand,
    DeleteSkillCommand,
} = require('../src/commands/skills');

program.name('cortex skills');
program.description('Work with Cortex Skills');

// Deploy Skill
program
    .command('deploy <skillNames...>')
    .description('Deploy the skill resource to the cluster')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck(async (skillNames, options) => {
        try {
            await new DeploySkillCommand(program).execute(skillNames, options);
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
    .option('-o, --output <json|yaml|k8s>', 'Format output as yaml or k8s resource')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--verbose', 'Verbose output')
    .action(withCompatibilityCheck(async (skillName, options) => {
        try {
            await new DescribeSkillCommand(program).execute(skillName, options);
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
    .action(withCompatibilityCheck(async (skillName, inputName, options) => {
        try {
            await new InvokeSkillCommand(program).execute(skillName, inputName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Skills
program
    .command('list')
    .description('List skill definitions')
    .alias('l')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--nostatus', 'skip extra call for skill status')
    .option('--noshared', 'do not list shared skills')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--filter [filter]', 'A Mongo style filter to use.')
    .option('--limit [limit]', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
    .option('--skip [skip]', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
    .option('--sort [sort]', 'A Mongo style sort statement to use in the query.', DEFAULT_LIST_SORT_PARAMS)

    .action(withCompatibilityCheck(async (options) => {
        try {
            await new ListSkillsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Skill
program
    .command('delete <skillName>')
    .description('Delete a skill')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--json', 'Output results using JSON')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck(async (skillName, options) => {
        try {
            await new DeleteSkillCommand(program).execute(skillName, options);
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
    .option('-k, --k8sResource [file...]', 'Additional kubernetes resources deployed and owned by the skill')
    .option('--podspec [podspec]', 'A file containing either a JSON or YAML formatted pod spec to merge with the skill definition, used for specifying resources (like memory, ephemeral storage, CPUs, and GPUs) and tolerations (like allowing pods to be scheduled on tainted nodes).')
    .option('-y, --yaml', 'Use YAML for skill definition format')
    .option('--scaleCount [count]', 'Scale count, only used for daemon action types')
    .action(withCompatibilityCheck(async (skillDefinition, options) => {
        try {
            await new SaveSkillCommand(program).execute(skillDefinition, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Undeploy Skill
program
    .command('undeploy <skillNames...>')
    .description('Undeploy the skill resource from the cluster')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck(async (skillNames, options) => {
        try {
            await new UndeploySkillCommand(program).execute(skillNames, options);
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
    .action(withCompatibilityCheck(async (skillName, actionName, options) => {
        try {
            await new SkillLogsCommand(program).execute(skillName, actionName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
