#!/usr/bin/env node
import esMain from 'es-main';

import { Command } from 'commander';
import { callCommand } from '../src/compatibility.js';
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
        .action(callCommand((snapshotIds, options) => {
                new DeploySnapshotCommand(program).execute(snapshotIds, options);
        }));
    program
        .command('campaign <campaignName>')
        .description('Export Campaigns for deployment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--deployable [boolean]', 'Export only ready to deploy Campaigns', true)
        .action(callCommand((campaignName, options) => {
                new DeployCampaignCommand(program).execute(campaignName, options);
        }));
    program
        .command('connection <connectionName>')
        .description('Export Connection for deployment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .action(callCommand((connectionName, options) => {
                new DeployConnectionCommand(program).execute(connectionName, options);
        }));
    program
        .command('skill <skillName>')
        .description('Export Skill for deployment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--latestRun [boolean]', 'Export latest run of experiment if not specified')
        .action(callCommand((skillName, options) => {
                new DeploySkillCommand(program).execute(skillName, options);
        }));
    program
        .command('experiment <experimentName> [runId]')
        .description('Export Experiment with Model and Run for deployment')
        .option('--no-compat', 'Ignore API compatibility checks')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--latestRun [boolean]', 'Export latest run of experiment if not specified')
        .action(callCommand((experimentName, runId, options) => {
                new DeployExperimentCommand(program).execute(experimentName, runId, options);
        }));
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
