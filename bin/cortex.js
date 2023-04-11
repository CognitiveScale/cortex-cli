#!/usr/bin/env node
import { Command } from 'commander';
import esMain from 'es-main';
import { readPackageJSON } from '../src/commands/utils.js';

export function create() {
    const program = new Command();
    program.version(readPackageJSON('../../package.json').version);
    program.name('cortex');
    program
        .description('Cortex CLI')
        .option('--debug', 'Enables enhanced log output for debugging', false)
        .on('option:debug', () => {
            process.env.DEBUG = '*';
        })
        .command('actions <cmd>', 'Work with Cortex Actions')
        .command('agents <cmd>', 'Work with Cortex Agents')
        .command('assessments <cmd>', 'Work with Cortex Impact Assessments')
        .command('campaigns <cmd>', 'Work with Cortex Campaigns')
        .command('configure', 'Configure the Cortex CLI')
        .command('connections <cmd>', 'Work with Cortex Connections')
        .command('content <cmd>', 'Work with Cortex Managed Content')
        .command('deploy <cmd>', 'Work with Cortex Artifacts export for deployment')
        .command('docker <cmd>', 'Work with Docker')
        .command('experiments <cmd>', 'Work with Cortex Experiments')
        .command('generate <cmd>', 'Scaffold Cortex Components')
        .command('workspaces <cmd>', 'Scaffold Cortex Components')
        .command('missions <cmd>', 'Work with Cortex Missions')
        .command('models <cmd>', 'Work with Cortex Models')
        .command('projects <cmd>', 'Work with Cortex Projects')
        .command('roles <cmd>', 'Work with a Cortex Roles')
        .command('secrets <cmd>', 'Work with Cortex Secrets')
        .command('sessions <cmd>', 'Work with Cortex Sessions')
        .command('skills <cmd>', 'Work with Cortex Skills')
        .command('tasks <cmd>', 'Work with Cortex Tasks')
        .command('types <cmd>', 'Work with Cortex Types')
        .command('users <cmd>', 'Work with a Cortex Users');
    return program;
}
if (esMain(import.meta)) {
    // module was not imported but called directly
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
