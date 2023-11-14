#!/usr/bin/env node
import { Command } from 'commander';
import esMain from 'es-main';
import { readPackageJSON } from '../src/commands/utils.js';
import { loadProfile } from '../src/config.js';
import { FeatureController } from '../src/features.js';
// Global varible storing loaded profile - only used to avoid duplicate calls
let profile;

export async function create(profileName) {
    const program = new Command();
    program.version(readPackageJSON('../../package.json').version, '-v, --version', 'Outputs the installed version of the Cortex CLI');
    program.name('cortex');
    program
        .description('Cortex CLI')
        .option('--debug', 'Enables enhanced log output for debugging', false)
        .on('option:debug', () => {
            process.env.DEBUG = '*';
        });

    // Only Load the users Profile & do a compatibility check once on startup
    if (profile === undefined || profile === null) {
        profile = await loadProfile(profileName);
        process.env.CORTEX_TOKEN_SILENT = profile.token;
        process.env.CORTEX_FEATURE_FLAGS = JSON.stringify(profile.featureFlags);
    }

    // Dynamically add subcommands - only include those that are supported by the server
    const features = new FeatureController(profile);
    const supportedCommands = features.getSupportedSubCommands();
    const _toObject = (nameAndArgs, description) => ({ nameAndArgs, description });
    const isCommandSupported = ({ nameAndArgs }) => (supportedCommands.includes(nameAndArgs.split(' ')[0].trim()));
    const allCommands = [
        _toObject('actions <cmd>', 'Work with Cortex Actions'),
        _toObject('agents <cmd>', 'Work with Cortex Agents'),
        _toObject('assessments <cmd>', 'Work with Cortex Impact Assesments'),
        _toObject('campaigns <cmd>', 'Work with Cortex Campaigns'),
        _toObject('configure', 'Configure the Cortex CLI'),
        _toObject('connections <cmd>', 'Work with Cortex Connections'),
        _toObject('content <cmd>', 'Work with Cortex Managed Content'),
        _toObject('deploy <cmd>', 'Work with Cortex Artifacts export for deployment'),
        _toObject('docker <cmd>', 'Work with Docker'),
        _toObject('experiments <cmd>', 'Work with Cortex Experiments'),
        _toObject('missions <cmd>', 'Work with Cortex Missions'),
        _toObject('models <cmd>', 'Work with Cortex Models'),
        _toObject('pipelines <cmd>', 'Work with Cortex Pipelines'),
        _toObject('projects <cmd>', 'Work with Cortex Projects'),
        _toObject('roles <cmd>', 'Work with a Cortex Roles'),
        _toObject('secrets <cmd>', 'Work with Cortex Secrets'),
        _toObject('sessions <cmd>', 'Work with Cortex Sessions'),
        _toObject('skills <cmd>', 'Work with Cortex Skills'),
        _toObject('tasks <cmd>', 'Work with Cortex Tasks'),
        _toObject('types <cmd>', 'Work with Cortex Types'),
        _toObject('users <cmd>', 'Work with a Cortex Users'),
        _toObject('workspaces <cmd>', 'Scaffold Cortex Components'),
    ];
    allCommands
        .filter(isCommandSupported)
        .forEach(({ nameAndArgs, description }) => {
            program.command(nameAndArgs, description);
        });
    return program;
}

if (esMain(import.meta)) {
    // module was not imported but called directly
    let _profile;
    if (process.argv.includes('--profile')) {
        // Pre-process arguments to extract user specified '--profile'. This
        // allows the CLI to load the profile config, without requiring arg
        // processing (chicken & egg problem). Additionally, the '--profile' flag
        // means different things depending on the subcommand being run.
        const idx = process.argv.indexOf('--profile') + 1;
        _profile = process.argv[idx] ?? _profile; // possibly undefined
    }
    (await create(_profile)).showHelpAfterError().parseAsync(process.argv);
}
export default await create();
