#!/usr/bin/env node
import { Command } from 'commander';
import esMain from 'es-main';
import { readPackageJSON } from '../src/commands/utils.js';
import { loadProfile } from '../src/config.js';
import { FeatureController } from '../src/features.js';
// import { doCompatibilityCheck } from '../src/compatibility.js';


/**
 *  NOTES:
 *  - Compatibility check (i.e. Cluster INFO check) neeeds to be done before every CLI command, even HELP commands, and only the specified
 *    options are displayed to the user.
 *  - Define Mapping of Feature Flags to CLI commands
 *  - Add `PREVIEW_FEATURES_ENABLED` environment variable, always defaults to false, but can override compatibility
 *  - Implementation wise, I can move the existing compatibility check to happen prior to creating the Commander command
 */

function _toObject(nameAndArgs, description) {
    return { nameAndArgs, description };
}

// Global varible storing spe
let profile;

export async function create(profileName) {
    const program = new Command();
    program.version(readPackageJSON('../../package.json').version, '-v, --version', 'Outputs the installed version of the Cortex CLI');
    program.name('cortex');

    // Only Load the users Profile Once - resolves the available set of CLI commands
    if (profile === undefined || profile === null) {
        profile = await loadProfile(profileName);
        // doCompatibilityCheck(profile);
    }
    const features = new FeatureController(profile);
    const supportedCommands = features.getSupportedSubCommands();

    // options
    // - move compat check to happen at startup (downside is earlier parsing of --no-compat)
    // - move compat check to happen before each subcommand (use subcommand hook here)
    // - somehow pass the profile from this module to the submodule? (Would sharing of a global variable)

    // - preSubcommand hook -> called before delegating to each subcommand, includes -h
    // - preAction hook -> before executing an action, does not work when applied to 'cortex' (needs to be on something with an Action), does not include '-h'
    program.hook('preAction', (thisCommand, subCommand) => {
        console.log(`preAction, ${thisCommand._name}, ${subCommand._name}`);
    });
    program.hook('preSubcommand', (thisCommand, subCommand) => {
        console.log(`preSubcommand, ${thisCommand._name}, ${subCommand._name}`);
    });

    program
        .description('Cortex CLI')
        .option('--debug', 'Enables enhanced log output for debugging', false)
        // .option('--no-compat', 'Ignore API compatibility checks') // TODO: move this here
        .on('option:debug', () => {
            process.env.DEBUG = '*';
        });

    // Dynamically add subcommands - only those that are supported by the server
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
        .filter(({ nameAndArgs }) => {
            const name = nameAndArgs.split(' ')[0].trim();
            return supportedCommands.includes(name);
        })
        .forEach(({ nameAndArgs, description }) => {
            program.command(nameAndArgs, description);
        });
    return program;
}

if (esMain(import.meta)) {
    // module was not imported but called directly
    let _profile;
    if (process.argv.includes('--profile')) {
        // pre-process arguments to extract user specified '--profile'
        const idx = process.argv.indexOf('--profile') + 1;
        _profile = process.argv[idx] ?? _profile; // possibly undefined
    }
    (await create(_profile)).showHelpAfterError().parseAsync(process.argv);
}
export default await create();
