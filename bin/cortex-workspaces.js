import { Command } from 'commander';
import process from 'node:process';
import esMain from 'es-main';
import WorkspaceConfigureCommand from '../src/commands/workspaces/configure.js';
import WorkspaceGenerateCommand from '../src/commands/workspaces/generate.js';
import WorkspaceBuildCommand from '../src/commands/workspaces/build.js';
import WorkspacePublishCommand from '../src/commands/workspaces/publish.js';
import {
 WorkspaceAddRegistryCommand, WorkspaceRemoveRegistryCommand, WorkspaceActivateRegistryCommand, WorkspaceListRegistryCommand, 
} from '../src/commands/workspaces/registry.js';
import { printError } from '../src/commands/utils.js';

export function create() {
    const program = new Command();

    program.name('cortex workspaces');
    program.description('Scaffolding Cortex Components');
    program
        .command('configure')
        .option('--refresh', 'Refresh the Github access token')
        .option('--color [boolean]', 'Turn on/off colors', 'true')
        .description('Configures the Cortex Template System for generating skill templates')
        .action((options) => {
            try {
                return new WorkspaceConfigureCommand(program).execute(options);
            } catch (err) {
                return printError(err.message);
            }
        });
    program
        .command('generate [name] [destination]')
        .option('--color [boolean]', 'Turn on/off colors', 'true')
        .option('--notree [boolean]', 'Do not display generated file tree', 'false')
        .option('--template <templateName>', 'Name of template to use')
        .description('Generates a workspace based on a template from the template repository')
        .action((name, destination, options) => {
            try {
                return new WorkspaceGenerateCommand(program).execute(name, destination, options);
            } catch (err) {
                return printError(err.message);
            }
        });
    program
        .command('build [folder]')
        .option('--profile <profile>', 'The profile to use')
        .option('--color [boolean]', 'Turn on/off colors', 'true')
        .option('--dockerCli <string>', 'Specify the docker client, the following are supported [docker, nerdctl, podman]. If not specified the cli will scan the PATH for available clients')
        .option('--skill <skill name>', 'Build only the specified skill')
        .description('Builds all skills in the workspace, or optionally only the specified skill')
        .action((folder, options) => {
            try {
                return new WorkspaceBuildCommand(program).execute(folder, options);
            } catch (err) {
                return printError(err.message);
            }
        });
    program
        .command('publish [folder]')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project name>', 'Publish to the specified project')
        .option('--color [boolean]', 'Turn on/off colors', 'true')
        .option('--dockerCli <string>', 'Specify the docker client, the following are supported [docker, nerdctl, podman]. If not specified the cli will scan the PATH for available clients')
        .option('--skip-push', 'Don\'t push images to docker registry')
        .option('--skill <skill name>', 'Publish only the specified skill')
        .description('Publishes all skills and resources in the workspace')
        .action(async (folder, options) => {
            try {
                await (new WorkspacePublishCommand(program)).execute(folder, options);
            } catch (err) {
                printError(err.message);
            }
        });
    const registry = program
        .command('registry')
        .description('Manage image repositories.');
    registry
        .command('add [name]')
        .option('--profile <profile>', 'The profile to use')
        .option('--color [boolean]', 'Turn on/off colors', 'true')
        .option('--url <registry url>', 'Registry URL')
        .option('--namespace <registry namespace>', 'Registry Namespace')
        .description('Adds an image registry to publish to.')
        .action((name, options) => {
            try {
                return new WorkspaceAddRegistryCommand(program).execute(name, options);
            } catch (err) {
                return printError(err.message);
            }
        });
    registry
        .command('remove [name]')
        .option('--profile <profile>', 'The profile to use')
        .option('--color [boolean]', 'Turn on/off colors', 'true')
        .description('Removes the specified image registry.')
        .action((name, options) => {
            try {
                return new WorkspaceRemoveRegistryCommand(program).execute(name, options);
            } catch (err) {
                return printError(err.message);
            }
        });
    registry
        .command('activate [name]')
        .option('--profile <profile>', 'The profile to use')
        .option('--color [boolean]', 'Turn on/off colors', 'true')
        .description('Activates the specified image registry.')
        .action((name, options) => {
            try {
                return new WorkspaceActivateRegistryCommand(program).execute(name, options);
            } catch (err) {
                return printError(err.message);
            }
        });
    registry
        .command('list')
        .option('--profile <profile>', 'The profile to use')
        .option('--color [boolean]', 'Turn on/off colors', 'true')
        .description('Lists all image registries')
        .action((options) => {
            try {
                return new WorkspaceListRegistryCommand(program).execute(options);
            } catch (err) {
                return printError(err.message);
            }
        });
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
