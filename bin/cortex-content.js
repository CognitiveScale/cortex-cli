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

const program = require('commander');
const chalk = require('chalk');
const { ListContent, UploadContent, DeleteContent, DownloadContent } = require('../src/commands/content');

let processed = false;
program.description('Work with Cortex Contents');


// List Content
program
    .command('list')
    .description('List content')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--json', 'Output results using JSON')
    .option('--query [query]', 'A JMESPath query to use in filtering the response data. Ignored if output format is not JSON.')
    .action((options) => {
        try {
            new ListContent(program).execute(options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Upload Content
program
    .command('upload <contentKey> <filePath>')
    .description('Upload content')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--secure', 'Uploads the content securely to the Cortex Vault. Use this option for keytab files or content that contains sensitive information that is required during Runtime. Take note of the contentKey you give to this content for future reference.')
    .action((contentKey, filePath, options) => {
        try {
            new UploadContent(program).execute(contentKey, filePath, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Delete Content
program
    .command('delete <contentKey>')
    .description('Delete content')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .action((contentKey, options) => {
        try {
            new DeleteContent(program).execute(contentKey, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });

// Download Content
program
    .command('download <contentKey>')
    .description('Download content')
    .option('--color [on/off]', 'Turn on/off color output.', 'on')
    .option('--profile [profile]', 'The profile to use')
    .option('--secure', 'Downloads the content securely from the Cortex Vault.')
    .action((contentKey, options) => {
        try {
            new DownloadContent(program).execute(contentKey, options);
            processed = true;
        }
        catch (err) {
            console.error(chalk.red(err.message));
        }
    });


process.env.DOC && require('../src/commands/utils').exportDoc(program);
program.parse(process.argv);
if (!processed)
    ['string', 'undefined'].includes(typeof program.args[0]) && program.help();
