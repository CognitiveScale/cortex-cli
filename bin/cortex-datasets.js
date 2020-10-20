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
    ListDatasets,
    SaveDatasetsCommand,
    DescribeDatasetCommand,
    GetDataframeCommand,
    StreamDatasetCommand,
    GenerateDatasetCommand
} = require('../src/commands/datasets');

program.description('Work with Cortex Connections');


// List Dataset
program
    .command('list')
    .description('List Datasets')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using detailed JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListDatasets(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Save Dataset
program
    .command('save <datasetDefinition>')
    .description('Save a dataset definition. Takes JSON file by default.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('-y, --yaml', 'Use YAML for dataset file definition format')
    .action(withCompatibilityCheck((datasetDef, options) => {
        try {
            new SaveDatasetsCommand(program).execute(datasetDef, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Dataset
program
    .command('describe <datasetName>')
    .description('Describe dataset')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((datasetName, options) => {
        try {
            new DescribeDatasetCommand(program).execute(datasetName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get Dataframe
program
    .command('get-dataframe <datasetName>')
    .description('Get dataset in dataframe format')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((datasetName, options) => {
        try {
            new GetDataframeCommand(program).execute(datasetName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Get Stream
program
    .command('get-stream <datasetName>')
    .description('Stream dataset content')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((datasetName, options) => {
        try {
            new StreamDatasetCommand(program).execute(datasetName, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program
    .command('generate')
    .description('Generates the structure and top level build script for a dataset')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use', 'default')
    .option('--project [project]', 'The project to use')
    .action((options) => {  // deliberately not using withCompatibilityCheck()
        try {
            new GenerateDatasetCommand(program).execute(options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

program.parse(process.argv);
