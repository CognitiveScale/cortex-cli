#!/usr/bin/env node

/*
 * Copyright 2020 Cognitive Scale, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const chalk = require('chalk');
const program = require('commander');

const { WorkspaceConfigureCommand } = require('../src/commands/workspaces/configure');
const { WorkspaceGenerateCommand } = require('../src/commands/workspaces/generate');
const { WorkspaceBuildCommand } = require('../src/commands/workspaces/build');
const { WorkspacePublishCommand } = require('../src/commands/workspaces/publish');
const { 
    WorkspaceAddRegistryCommand, 
    WorkspaceRemoveRegistryCommand, 
    WorkspaceActivateRegistryCommand,
    WorkspaceListRegistryCommand,
} = require('../src/commands/workspaces/registry');
const { WorkspaceTestCommand } = require('../src/commands/workspaces/test');

program.name('cortex workspaces');
program.description('Scaffolding Cortex Components');

program
    .command('configure')
    .option('--refresh', 'Refresh the Github access token')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .description('Configures the Cortex Template System for generating skill templates')
    .action((options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceConfigureCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

    program
    .command('generate [name] [destination]')
    .option('--registry [registry]', 'Override the docker registry to publish to')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .option('--notree', 'Do not display generated file tree', false)
    .description('Generates a workspace based on a template from the template repository')
    .action((name, destination, options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceGenerateCommand(program).execute(name, destination, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

    program
    .command('build [folder]')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .option('--skill [skill name]', 'Build only the specified skill')
    .description('Builds all skills in the workspace, or optionally only the specified skill')
    .action((folder, options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceBuildCommand(program).execute(folder, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

    program
    .command('publish [folder]')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .option('--skill [skill name]', 'Publish only the specified skill')
    .description('Publishes all skills and resources in the workspace')
    .action((folder, options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspacePublishCommand(program).execute(folder, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

    const registry = program
    .command('registry')
    .description('Manage image repositories.');

    registry
    .command('add [name]')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .option('--url [registry url]', 'Registry URL')
    .option('--namespace [registry namespace]', 'Registry Namespace')
    .description('Adds an image registry to publish to.')
    .action((name, options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceAddRegistryCommand(program).execute(name, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

    registry
    .command('remove [name]')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .description('Removes the specified image registry.')
    .action((name, options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceRemoveRegistryCommand(program).execute(name, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

    registry
    .command('activate [name]')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .description('Activates the specified image registry.')
    .action((name, options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceActivateRegistryCommand(program).execute(name, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

    registry
    .command('list')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .description('Lists all image registries')
    .action((options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceListRegistryCommand(program).execute(options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

    program
    .command('test [folder]')
    .option('--color [on/off]', 'Turn on/off colors', 'on')
    .option('--skill [skill name]', 'Test only the specified skill')
    .option('--input [input name]', 'Test only the specified input')
    .description('Tests the specified skill locally')
    .action((folder, options) => { // deliberately not using withCompatibilityCheck()
        try {
            new WorkspaceTestCommand(program).execute(folder, options);
        } catch (err) {
            console.error(chalk.red(err.message));
        }
    });

if (require.main === module) {
    program.showHelpAfterError().parseAsync(process.argv);
}
module.exports = program;
