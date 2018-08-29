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
    ListJobs,
    JobStatus,
    DescribeJob,
    SaveJob
} = require('../src/commands/jobs');

program.description('Work with Cortex Jobs');


// List Jobs
program
    .command('list')
    .description('List job definitions')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListJobs(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Job
program
    .command('describe <jobDefinition>')
    .description('Describe job definition')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((jobDefinition, options) => {
        try {
            new DescribeJob(program).execute(jobDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get Job Status
program
    .command('status <jobDefinition>')
    .description('Get job status')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck((jobDefinition, options) => {
        try {
            new JobStatus(program).execute(jobDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


// Save Job
program
    .command('save <jobDefinition>')
    .description('Save a job definition')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for job definition format')
    .action(withCompatibilityCheck((jobDefinition, options) => {
        try {
            new SaveJob(program).execute(jobDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
