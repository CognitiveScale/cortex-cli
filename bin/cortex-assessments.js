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
    ListResourcesCommand,
    ListResourceTypesCommand,
    CreateAssessmentCommand,
    ListAssessmentCommand,
    DescribeAssessmentCommand,
    DeleteAssessmentCommand,
    RunAssessmentCommand,
    ListAssessmentReportCommand,
    GetAssessmentReportCommand,
    ExportAssessmentReportCommand,
    DependencyTreeCommand,
} = require('../src/commands/assessments');

program.description('Work with Cortex Assessments');

program
    .command('list-types')
    .description('List Cortex resource types')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListResourceTypesCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('dependency-tree')
    .description('Dependencies of a resource')
    .storeOptionsAsProperties(false)
    .requiredOption('--scope [project]', 'project name of the resource')
    .requiredOption('--name [Cortex component name]', 'Cortex component name')
    .requiredOption('--type [Cortex component types]', 'Cortex resource type')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((options) => {
        try {
            new DependencyTreeCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('list-resources')
    .description('List matching resources')
    .storeOptionsAsProperties(false)
    .option('--scope [projects]', 'Assessment scope projects (comma separated values)')
    .option('--name [Cortex component name]', 'Cortex component name (case insensitive regex/substring match)')
    .option('--type [Cortex component types]', 'Assessment scope component types (comma separated values)')
    .option('--skip [Skip records for pagination]', 'Skip records for pagination')
    .option('--limit [Limit records for pagination]', 'Limit records for pagination')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListResourcesCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('create [assessmentDefinition]')
    .alias('save')
    .description('Create an assessment. Do `list-resources` and `list-types` to select component and type')
    .storeOptionsAsProperties(false)
    .option('--name [name]', 'Assessment name')
    .option('--title [title]', 'Assessment title')
    .option('--description [description]', 'Assessment description')
    .option('--scope [projects]', 'Assessment scope projects (comma separated values)')
    .option('--component [Cortex component name]', 'Cortex component name')
    .option('--type [Cortex component types]', 'Assessment scope component types (comma separated values)')
    .option('--overwrite [boolean]', 'Overwrite existing assessment, if exists')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML format')
    .action(withCompatibilityCheck((assessmentDefinition, options) => {
        try {
            new CreateAssessmentCommand(program).execute(assessmentDefinition, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('list')
    .description('List assessments')
    .option('--skip [Skip records for pagination]', 'Skip records for pagination')
    .option('--limit [Limit records for pagination]', 'Limit records for pagination')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListAssessmentCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('describe <assessmentName>')
    .alias('get')
    .description('Describe the assessment')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((assessmentName, options) => {
        try {
            new DescribeAssessmentCommand(program).execute(assessmentName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('delete <assessmentName>')
    .description('Delete the assessment and its generated reports')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((assessmentName, options) => {
        try {
            new DeleteAssessmentCommand(program).execute(assessmentName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('report <assessmentName>')
    .description('Run report generation of the assessment')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((assessmentName, options) => {
        try {
            new RunAssessmentCommand(program).execute(assessmentName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('report-list <assessmentName>')
    .description('Lists reports of the assessment')
    .option('--skip [Skip records for pagination]', 'Skip records for pagination')
    .option('--limit [Limit records for pagination]', 'Limit records for pagination')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((assessmentName, options) => {
        try {
            new ListAssessmentReportCommand(program).execute(assessmentName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('report-get <assessmentName> <reportId>')
    .description('Get report of the assessment')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((assessmentName, reportId, options) => {
        try {
            new GetAssessmentReportCommand(program).execute(assessmentName, reportId, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('report-export <assessmentName> <reportId>')
    .description('Export report of the assessment')
    .storeOptionsAsProperties(false)
    .option('--type [Cortex component types]', 'Component types to export (comma separated values)')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action(withCompatibilityCheck((assessmentName, reportId, options) => {
        try {
            new ExportAssessmentReportCommand(program).execute(assessmentName, reportId, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
