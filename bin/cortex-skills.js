#!/usr/bin/env node
import esMain from 'es-main';
import process from 'node:process';
import { Command } from 'commander';
import { callCommand } from '../src/compatibility.js';
import {
    DEFAULT_LIST_LIMIT_COUNT,
    DEFAULT_LIST_SKIP_COUNT,
    DEFAULT_LIST_SORT_PARAMS,
    GET_DEFAULT_SORT_CLI_OPTION,
    LIST_JSON_HELP_TEXT,
    QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';
import {
    DeleteSkillCommand,
    DeploySkillCommand,
    DescribeSkillCommand,
    InvokeSkillCommand,
    ListSkillsCommand,
    SaveSkillCommand,
    SkillLogsCommand,
    UndeploySkillCommand,
} from '../src/commands/skills.js';
import { checkForEmptyArgs } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.name('cortex skills');
    program.description('Work with Cortex Skills');
// Deploy Skill
    program
        .command('deploy <skillNames...>')
        .description('Deploy the skill resource to the cluster')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--dryrun', 'Return the K8S skill resource and skip deployment to the cluster')
        .option('--stereotypes <stereotypes...>', 'Stereotype(s) to apply during deployment: use "none" to remove ALL stereotypes.\nNOTE: These will not be persisted with the skill definition')
        .action(callCommand(async (skillNames, options) => {
                checkForEmptyArgs({ skillNames });
                await new DeploySkillCommand(program).execute(skillNames, options);
        }));
// Describe Skill
    program
        .command('describe <skillName>')
        .alias('get')
        .description('Describe skill')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-f --output-file <file>', 'Write output to file instead of stdout')
        .option('-o, --output <json|yaml|k8s|openapi>', 'Format output as yaml or k8s resource', 'json')
        .option('--json [searchPath]', QUERY_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--verbose', 'Verbose output', false)
        .action(callCommand(async (skillName, options) => {
                checkForEmptyArgs({ skillName });
                await new DescribeSkillCommand(program).execute(skillName, options);
        }));
// Invoke Skill
    program
        .command('invoke <skillName> <inputName>')
        .description('Invoke a skill')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', true)
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--params <params>', 'JSON params to send to the action')
        .option('--params-file <paramsFile>', 'A file containing either JSON or YAML formatted params')
        .option('--sync', 'Invoke the skill synchronously', false)
        .action(callCommand(async (skillName, inputName, options) => {
                checkForEmptyArgs({ skillName, inputName });
                await new InvokeSkillCommand(program).execute(skillName, inputName, options);
        }));
// List Skills
    program
        .command('list')
        .description('List skill definitions')
        .alias('l')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--nostatus', 'skip extra call for skill status')
        .option('--noshared', 'do not list shared skills')
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS.updatedAt))
        .action(callCommand(async (options) => {
                await new ListSkillsCommand(program).execute(options);
        }));
// Delete Skill
    program
        .command('delete <skillName>')
        .description('Delete a skill')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--json', 'Output results using JSON')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand(async (skillName, options) => {
                checkForEmptyArgs({ skillName });
                await new DeleteSkillCommand(program).execute(skillName, options);
        }));
// Save Skill
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
        .action(callCommand(async (skillDefinitions, options) => {
                await new SaveSkillCommand(program).execute(skillDefinitions, options);
        }));
// Undeploy Skill
    program
        .command('undeploy <skillNames...>')
        .description('Undeploy the skill resource from the cluster')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((skillNames, options) => {
                checkForEmptyArgs({ skillNames });
                return new UndeploySkillCommand(program).execute(skillNames, options);
        }));
// Get Skill/action logs
    program
        .command('logs <skillName> <actionName>')
        .description('Get logs of a skill and action')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--raw', 'Get raw logs as a stream')
        // TODO enable when we want to support tasks
        // .option('--type [type]', 'The type of action logs to fetch [skill|task]')
        .action(callCommand((skillName, actionName, options) => {
                checkForEmptyArgs({ skillName, actionName });
                return new SkillLogsCommand(program).execute(skillName, actionName, options);
        }));
    return program;
}
if (esMain(import.meta)) {
    await create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
