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
    SaveProfileSchemaCommand,
    ListProfileSchemasCommand,
    ListProfileVersionsCommand,
    DescribeProfileSchemaCommand,
    DeleteProfileSchemaCommand,
    ListProfilesCommand,
    DescribeProfileCommand,
    DeleteProfileCommand,
    RebuildProfilesCommand,
} = require('../src/commands/profiles');

program.description('Work with Cortex Profiles');

// Save Profile Schema
program
    .command('save-schema <profileSchema>')
    .description('Save a profile schema')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The configuration profile to use')
    .option('--project [project]', 'The project to use')
    .option('-y, --yaml', 'Use YAML for profile schema format')
    .action(withCompatibilityCheck((profileSchema, options) => {
        try {
            new SaveProfileSchemaCommand(program).execute(profileSchema, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Profile Schemas
program
    .command('list-schemas')
    .description('List profile schemas')
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
            new ListProfileSchemasCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Describe Profile Schema
program
    .command('describe-schema <schemaName>')
    .description('Describe Profile Schema')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((schemaName, options) => {
        try {
            new DescribeProfileSchemaCommand(program).execute(schemaName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Profile Schema
program
    .command('delete-schema <schemaName>')
    .description('Delete a Profile Schema')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((schemaName, options) => {
        try {
            new DeleteProfileSchemaCommand(program).execute(schemaName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Profiles
program
    .command('list')
    .description('List profiles')
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
            new ListProfilesCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// List Profile Versions
program
    .command('list-versions <profileId> [schemaName]')
    .description('List Profile Versoins')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .option('--before [before]', 'Filter versions before a specific date.')
    .option('--after [after]', 'Filter versions after a specific date.')
    .option('--limit [limit]', 'Limit the number of events returned.')
    .action(withCompatibilityCheck((profileId, schemaName, options) => {
        try {
            new ListProfileVersionsCommand(program).execute(profileId, schemaName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));


// Describe Profile
program
    .command('describe <profileId> [schemaName]')
    .description('Describe Profile Schema')
    .option('--historic', 'Describe the historic version of the profile.')
    .option('--versionLimit [versionLimit]', 'Limit the version of the profile being described.')
    .option('--attribute [attribute]', 'Describe a specific attribute in the profile.')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data.')
    .action(withCompatibilityCheck((profileId, schemaName, options) => {
        try {
            new DescribeProfileCommand(program).execute(profileId, schemaName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Profile
program
    .command('delete <profileId> [schemaName]')
    .description('Delete a Profile')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((profileId, schemaName, options) => {
        try {
            new DeleteProfileCommand(program).execute(profileId, schemaName, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Rebuild Profile
program
    .command('rebuild <schemaName> [profileId]')
    .description('Rebuild a Profile')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--filter [filter]', 'A Mongo style filter to use as the event query.')
    .option('--sort [sort]', 'A Mongo style sort statement to use in the event query.')
    .option('--limit [limit]', 'Limit the number of events returned.')
    .option('--skip [skip]', 'Move the result cursor to this position before returning results.')
    .action(withCompatibilityCheck((schemaName, profileId, options) => {
        try {
            new RebuildProfilesCommand(program).execute(schemaName, profileId, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

program.parse(process.argv);
