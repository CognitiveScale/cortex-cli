#!/usr/bin/env -S node --no-warnings
import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
    CreateAssessmentCommand,
    DeleteAssessmentCommand,
    DependencyTreeCommand,
    DescribeAssessmentCommand,
    ExportAssessmentReportCommand,
    GetAssessmentReportCommand,
    ListAssessmentCommand,
    ListAssessmentReportCommand,
    ListResourceTypesCommand,
    ListResourcesCommand,
    RunAssessmentCommand,
} from '../src/commands/assessments.js';
import {
    DEFAULT_LIST_LIMIT_COUNT,
    DEFAULT_LIST_SKIP_COUNT,
    DEFAULT_LIST_SORT_PARAMS,
    GET_DEFAULT_SORT_CLI_OPTION,
    LIST_JSON_HELP_TEXT,
    QUERY_JSON_HELP_TEXT,
} from '../src/constants.js';

export function create() {
    const program = new Command();
    program.name('cortex assessments');
    program.description('Work with Cortex Assessments');
    program
        .command('list-types')
        .description('List Cortex resource types')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck((options) => {
            try {
                new ListResourceTypesCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('dependency-tree [dependencyFile]')
        .description('Dependencies of a resource or find missing ones from dependencyFile')
        .storeOptionsAsProperties(false)
        .requiredOption('--scope <project>', 'project name of the resource')
        .option('--name <Cortex component name>', 'Cortex component name', ' ')
        .option('--type <Cortex component type>', 'Cortex resource type', ' ')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--missing [boolean]', 'Filter only missing dependencies')
        .action(withCompatibilityCheck((dependencyFile, options) => {
            try {
                new DependencyTreeCommand(program).execute(dependencyFile, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('list-resources')
        .description('List matching resources')
        .storeOptionsAsProperties(false)
        .option('--scope <projects>', 'Assessment scope projects (comma separated values)')
        .option('--name <Cortex component name>', 'Cortex component name (case insensitive regex/substring match)')
        .option('--type <Cortex component types>', 'Assessment scope component types (comma separated values)')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.')
        .action(withCompatibilityCheck((options) => {
            try {
                new ListResourcesCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('create [assessmentDefinition]')
        .alias('save')
        .description('Create an assessment. Do `list-resources` and `list-types` to select component and type')
        .storeOptionsAsProperties(false)
        .option('--name <name>', 'Assessment name')
        .option('--title <title>', 'Assessment title')
        .option('--description <description>', 'Assessment description')
        .option('--scope <projects>', 'Assessment scope projects (comma separated values)')
        .option('--component <Cortex component name>', 'Cortex component name (case insensitive regex/substring match)')
        .option('--type <Cortex component types>', 'Assessment scope component types (comma separated values)')
        .option('--overwrite [boolean]', 'Overwrite existing assessment, if exists')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('-y, --yaml', 'Use YAML format')
        .action(withCompatibilityCheck((assessmentDefinition, options) => {
            try {
                new CreateAssessmentCommand(program).execute(assessmentDefinition, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('list')
        .description('List assessments')
        .alias('l')
        .option('--skip <Skip records for pagination>', 'Skip records for pagination')
        .option('--limit <Limit records for pagination>', 'Limit records for pagination')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .option('--filter <filter>', 'A Mongo style filter to use.')
        .option('--limit <limit>', 'Limit number of records', DEFAULT_LIST_LIMIT_COUNT)
        .option('--skip <skip>', 'Skip number of records', DEFAULT_LIST_SKIP_COUNT)
        .option('--sort <sort>', 'A Mongo style sort statement to use in the query.', GET_DEFAULT_SORT_CLI_OPTION(DEFAULT_LIST_SORT_PARAMS._updatedAt))
        .action(withCompatibilityCheck((options) => {
            try {
                new ListAssessmentCommand(program).execute(options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('describe <assessmentName>')
        .alias('get')
        .description('Describe the assessment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(withCompatibilityCheck((assessmentName, options) => {
            try {
                new DescribeAssessmentCommand(program).execute(assessmentName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('delete <assessmentName>')
        .description('Delete the assessment and its generated reports')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(withCompatibilityCheck((assessmentName, options) => {
            try {
                new DeleteAssessmentCommand(program).execute(assessmentName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('report <assessmentName>')
        .description('Run report generation of the assessment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(withCompatibilityCheck((assessmentName, options) => {
            try {
                new RunAssessmentCommand(program).execute(assessmentName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('list-report <assessmentName>')
        .alias('report-list')
        .description('Lists reports of the assessment')
        .option('--skip <Skip records for pagination>', 'Skip records for pagination')
        .option('--limit <Limit records for pagination>', 'Limit records for pagination')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck((assessmentName, options) => {
            try {
                new ListAssessmentReportCommand(program).execute(assessmentName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('get-report <assessmentName> <reportId>')
        .alias('report-get')
        .description('Get report of the assessment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--json [searchQuery]', LIST_JSON_HELP_TEXT)
        .option('--query <query>', `[DEPRECATION WARNING] ${QUERY_JSON_HELP_TEXT}`)
        .action(withCompatibilityCheck((assessmentName, reportId, options) => {
            try {
                new GetAssessmentReportCommand(program).execute(assessmentName, reportId, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('export-report <assessmentName> <reportId>')
        .alias('report-export')
        .description('Export report of the assessment')
        .storeOptionsAsProperties(false)
        .option('--type <Cortex component types>', 'Component types to export (comma separated values)')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .action(withCompatibilityCheck((assessmentName, reportId, options) => {
            try {
                new ExportAssessmentReportCommand(program).execute(assessmentName, reportId, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
