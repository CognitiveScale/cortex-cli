#!/usr/bin/env node
import esMain from 'es-main';
import process from 'node:process';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
    DEFAULT_LIST_LIMIT_COUNT,
    DEFAULT_LIST_SKIP_COUNT,
    DEFAULT_LIST_SORT_PARAMS,
    GET_DEFAULT_SORT_CLI_OPTION,
    LIST_JSON_HELP_TEXT,
    QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';
import {
 DeleteStereotypeCommand, DescribeStereotypeCommand, ListStereotypesCommand, SaveStereotypeCommand, 
} from '../src/commands/stereotype.js';

export function create() {
    const program = new Command();
    program.name('cortex skill stereotypes');
    program.description('Work with Cortex Skill Stereotypes');
// Describe Stereotype
    program
        .command('describe <Name>')
        .alias('get')
        .description('Describe skill stereotype')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-f --output-file <file>', 'Write output to file instead of stdout')
        .option('-o, --output <json|yaml>', 'Format output as yaml', 'json')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--verbose', 'Verbose output', false)
        .action(withCompatibilityCheck(async (skillName, options) => {
                await new DescribeStereotypeCommand(program).execute(skillName, options);
        }));
// List Stereotypes
    program
        .command('list')
        .description('List skill stereotypes')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--noshared', 'do not list shared skills')
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
        .action(withCompatibilityCheck(async (options) => {
                await new ListStereotypesCommand(program).execute(options);
        }));
// Delete Stereotype
    program
        .command('delete <skillName>')
        .description('Delete a skill')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--json', 'Output results using JSON')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (skillName, options) => {
                await new DeleteStereotypeCommand(program).execute(skillName, options);
        }));
// Save Stereotype
    program
        .command('save <skillDefinitions...>')
        .description('Save a skill definition')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-k, --k8sResource <file...>', 'Additional kubernetes resources deployed and owned by the skill')
        // eslint-disable-next-line max-len
        .option('--podspec <podspec>', 'A file containing either a JSON or YAML formatted pod spec to merge with the skill definition, used for specifying resources (like memory, ephemeral storage, CPUs, and GPUs) and tolerations (like allowing pods to be scheduled on tainted nodes).')
        .option('-y, --yaml', 'Use YAML for skill definition format')
        .option('--scaleCount <count>', 'Scale count, only used for daemon action types')
        .action(withCompatibilityCheck(async (skillDefinitions, options) => {
                await new SaveStereotypeCommand(program).execute(skillDefinitions, options);
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
