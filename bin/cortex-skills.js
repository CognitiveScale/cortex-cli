#!/usr/bin/env node
import chalk from 'chalk';
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
    DeleteSkillCommand,
    DeploySkillCommand,
    DescribeSkillCommand,
    InvokeSkillCommand,
    ListSkillsCommand,
    SaveSkillCommand,
    SkillLogsCommand,
    UndeploySkillCommand,
} from '../src/commands/skills.js';

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
        .action(withCompatibilityCheck(async (skillNames, options) => {
            try {
                await new DeploySkillCommand(program).execute(skillNames, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
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
        .action(withCompatibilityCheck(async (skillName, options) => {
            try {
                await new DescribeSkillCommand(program).execute(skillName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
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
        .action(withCompatibilityCheck(async (skillName, inputName, options) => {
            try {
                await new InvokeSkillCommand(program).execute(skillName, inputName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
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
        .action(withCompatibilityCheck(async (options) => {
            try {
                await new ListSkillsCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
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
        .action(withCompatibilityCheck(async (skillName, options) => {
            try {
                await new DeleteSkillCommand(program).execute(skillName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
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
        .action(withCompatibilityCheck(async (skillDefinitions, options) => {
            try {
                await new SaveSkillCommand(program).execute(skillDefinitions, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
// Undeploy Skill
    program
        .command('undeploy <skillNames...>')
        .description('Undeploy the skill resource from the cluster')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck(async (skillNames, options) => {
            try {
                return await new UndeploySkillCommand(program).execute(skillNames, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
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
        .action(withCompatibilityCheck(async (skillName, actionName, options) => {
            try {
                return await new SkillLogsCommand(program).execute(skillName, actionName, options);
            } catch (err) {
                return console.error(chalk.red(err.message));
            }
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
