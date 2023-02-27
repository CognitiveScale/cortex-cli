#!/usr/bin/env -S node --no-warnings
import chalk from 'chalk';
import { Command } from 'commander';
import { withCompatibilityCheck } from '../src/compatibility.js';
import {
 DeploySnapshotCommand, DeployCampaignCommand, DeployConnectionCommand, DeployExperimentCommand, DeploySkillCommand, 
} from '../src/commands/deploy.js';

export function create() {
    const program = new Command();
    program.name('cortex deploy');
    program.description('Export Cortex artifacts for deployment');
// Export Agent Snapshot. Provide snapshotIds in quotes separated by space like "snapshotId1 snapshotId2". This is to support multiple agents in one deployment manifest file.
    program
        .command('snapshots <snapshotIds>')
        .description('Export Agent(s) snapshots(s) for deployment. Provide snapshotIds separated by space, as <"snapshotId1 snapshotId2 ...">')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('-y, --yaml', 'Use YAML for snapshot export format')
        .option('-f, --force', 'Force delete existing exported files')
        .option('--latestRun [boolean]', 'Export latest run of Experiment(s) if not specified')
        .action(withCompatibilityCheck((snapshotIds, options) => {
            try {
                new DeploySnapshotCommand(program).execute(snapshotIds, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('campaign <campaignName>')
        .description('Export Campaigns for deployment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--deployable [boolean]', 'Export only ready to deploy Campaigns', true)
        .action(withCompatibilityCheck((campaignName, options) => {
            try {
                new DeployCampaignCommand(program).execute(campaignName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('connection <connectionName>')
        .description('Export Connection for deployment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(withCompatibilityCheck((connectionName, options) => {
            try {
                new DeployConnectionCommand(program).execute(connectionName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('skill <skillName>')
        .description('Export Skill for deployment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--latestRun [boolean]', 'Export latest run of experiment if not specified')
        .action(withCompatibilityCheck((skillName, options) => {
            try {
                new DeploySkillCommand(program).execute(skillName, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    program
        .command('experiment <experimentName> [runId]')
        .description('Export Experiment with Model and Run for deployment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--latestRun [boolean]', 'Export latest run of experiment if not specified')
        .action(withCompatibilityCheck((experimentName, runId, options) => {
            try {
                new DeployExperimentCommand(program).execute(experimentName, runId, options);
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        }));
    return program;
}
if (import.meta.url === `file://${process.argv[1]}`) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
