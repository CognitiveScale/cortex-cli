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

const {
    ListContent,
    UploadContent,
    DeleteContent,
    DownloadContent,
} = require('../src/commands/content');

program.name('cortex content');
program.description('Work with Cortex Managed Content');

// List Content
program
    .command('list')
    .description('List content')
    .alias('ls')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action(withCompatibilityCheck((options) => {
        try {
            new ListContent(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Upload Content
program
    .command('upload <contentKey> <filePath>')
    .description('Upload content')
    .option('--progress', 'Show upload progress')
    .option('--test', 'Show what would be uploaded along with file size')
    .option('--recursive', 'Recursively walk <filePath> and prefix each path stored with <contentKey>')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .option('--content-type [MIME type]', 'Sets the `Content-Type` or MIME type of the content ( default: application/octet-stream )')
    .option('--chunkSize [int]', 'Number of files to simultaneous upload', 10)
    .action(withCompatibilityCheck((contentKey, filePath, options) => {
        try {
            new UploadContent(program).execute(contentKey, filePath, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Delete Content
program
    .command('delete <contentKey>')
    .description('Delete content')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((contentKey, options) => {
        try {
            new DeleteContent(program).execute(contentKey, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

// Download Content
program
    .command('download <contentKey>')
    .description('Download content')
    .option('--progress', 'Show download progress')
    .option('--no-compat', 'Ignore API compatibility checks')
    .option('--color [on/off]', 'Turn on/off colors for JSON output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--project [project]', 'The project to use')
    .action(withCompatibilityCheck((contentKey, options) => {
        try {
            new DownloadContent(program).execute(contentKey, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    }));

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
