#!/usr/bin/env node

/*
 * Copyright 2019 Cognitive Scale, Inc. All Rights Reserved.
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
    FindEventsCommand,
    PublishEventsCommand,
    GetEntityCommand,
    QueryGraphCommand,
} = require('../src/commands/graph');

program.description('Work with the Cortex Graph');

// Find Entity Events
program
    .command('find-events')
    .description('Find entity events in the event store')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--filter [filter]', 'A Mongo style filter to use as the event query.')
    .option('--sort [sort]', 'A Mongo style sort statement to use in the event query.')
    .option('--limit [limit]', 'Limit the number of events returned.')
    .option('--skip [skip]', 'Move the result cursor to this position before returning results.')
    .action(withCompatibilityCheck((options) => {
        try {
            new FindEventsCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Publish Events
program
    .command('publish [file]')
    .description('Publish events to the event store')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--tracking', 'Enable tracking event mode.')
    .option('--transform [templates]', 'Apply transform templates to the input JSON records.')
    .option('--dry-run', "Simulate the publish (but don't actually send events to the server).")
    .option('--auto', 'Enable auto attribute creation using each entity property as an attribute value.')
    .action(withCompatibilityCheck(async (file, options) => {
        await new PublishEventsCommand(program).execute(file, options)
            .catch(err => console.error(chalk.red(err.message)));
    }));

// Describe Entity
program
    .command('get-entity <entityId>')
    .description('Get an entity in the graph by ID')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck(async (entityId, options) => {
        try {
            new GetEntityCommand(program).execute(entityId, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Query the graph
program
    .command('query <query>')
    .description('Query the graph using the OpenCypher query language')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .action(withCompatibilityCheck(async (query, options) => {
        try {
            new QueryGraphCommand(program).execute(query, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
