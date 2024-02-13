#!/usr/bin/env node
import esMain from 'es-main';
import { Command } from 'commander';
import { callCommand } from '../src/compatibility.js';
import {
 DeleteSessionCommand, SaveSessionCommand, DescribeSessionCommand, ListSessionsCommand, 
} from '../src/commands/sessions.js';
import { DEFAULT_LIST_LIMIT_COUNT, LIST_JSON_HELP_TEXT, QUERY_JSON_HELP_TEXT } from '../src/constants.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();

    program.name('cortex sessions');
    program.description('Work with Cortex Sessions');
// List Sessions
    program
        .command('list')
        .description('List session definitions')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--limit <limit>', 'Number of sessions to list', DEFAULT_LIST_LIMIT_COUNT)
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(callCommand((options) => {
                new ListSessionsCommand(program).execute(options);
        }));
// Describe Session
    program
        .command('describe <sessionId>')
        .description('Describe session')
        .alias('get')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--verbose', 'Verbose output')
        .action(callCommand((sessionName, options) => {
                checkForEmptyArgs({ sessionName });
                new DescribeSessionCommand(program).execute(sessionName, options);
        }));
// Delete Session
    program
        .command('delete <sessionId>')
        .description('Delete a session')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((sessionName, options) => {
                checkForEmptyArgs({ sessionName });
                new DeleteSessionCommand(program).execute(sessionName, options);
        }));
// Save Session
    program
        .command('save <sessionDefinition>')
        .description('Save a session definition')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for session definition format')
        .action(callCommand((sessionDefinition, options) => {
                new SaveSessionCommand(program).execute(sessionDefinition, options);
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
