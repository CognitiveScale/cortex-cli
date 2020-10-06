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
    DeploySnapshotCommand
} = require('../src/commands/deploy');

program.description('Export Cortex artifacts for deployment');

// Export Agent Snapshot. Provide snapshotIds in quotes separated by space like "snapshotId1 snapshotId2". This is to support multiple agents in one deployment manifest file.
program
    .command('snapshots <snapshotIds>')
    .description('Export Agent(s) snapshots(s) for deployment. Provide snapshotIds separated by space, as <"snapshotId1 snapshotId2 ...">')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('-y, --yaml', 'Use YAML for snapshot export format')
    .action(withCompatibilityCheck((skillDefinition, options) => {
        try {
            new DeploySnapshotCommand(program).execute(skillDefinition, options);
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
