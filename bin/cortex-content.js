#!/usr/bin/env node
import esMain from 'es-main';
import { Command } from 'commander';
import { callCommand } from '../src/compatibility.js';
import {
 ListContent, UploadContent, DeleteContent, DownloadContent, 
} from '../src/commands/content.js';
import { LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT } from '../src/constants.js';

export function create() {
    const program = new Command();
    program.name('cortex content');
    program.description('Work with Cortex Managed Content');
// List Content
    program
        .command('list')
        .description('List content')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--prefix <prefix>', 'Filter contents with the given prefix.')
        .action(callCommand((options) => {
                new ListContent(program).execute(options);
        }));
// Upload Content
    program
        .command('upload <contentKey> <filePath>')
        .description('Upload content')
        .option('--progress', 'Show upload progress')
        .option('--test', 'Show what would be uploaded along with file size')
        .option('-r, --recursive', 'Recursively walk <filePath> and prefix each path stored with <contentKey>')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--content-type <MIME type>', 'Sets the `Content-Type` or MIME type of the content ( default: application/octet-stream )')
        .option('--chunkSize <int>', 'Number of files to simultaneous upload', 10)
        .action(callCommand((contentKey, filePath, options) => new UploadContent(program).execute(contentKey, filePath, options)));
// Delete Content
    program
        .command('delete <contentKey>')
        .description('Delete content')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((contentKey, options) => new DeleteContent(program).execute(contentKey, options)));
// Download Content
    program
        .command('download <contentKey>')
        .description('Downloads content which can be piped to a file on disk. `cortex content download filename > filename.json`')
        .option('--progress', 'Show download progress')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((contentKey, options) => {
                new DownloadContent(program).execute(contentKey, options);
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
