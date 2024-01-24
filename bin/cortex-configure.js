import chalk from 'chalk';
import esMain from 'es-main';
import { Command } from 'commander';
import {
 ConfigureCommand, DescribeProfileCommand, ListProfilesCommand, SetProfileCommand, GetAccessToken, PrintEnvVars, 
} from '../src/commands/configure.js';

export function create() {
    const program = new Command();
    program.name('cortex configure');
    program.description('Configure cortex connection profiles');
    program.command('create', { isDefault: true })
        .description('Authenticate to cortex (default command)')
        .option('--file <file>', 'Personal access config file location')
        .option('--profile <profile>', 'The profile to configure', 'default')
        .option('--project <project>', 'The default project')
        .action(async (options, command) => {
                await new ConfigureCommand(command).execute(options);
        });
    program
        .command('token')
        .description('Create access token')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--ttl <time>', 'The amount of time for this login to remain active, expressed as a number of hours, days, or weeks (e.g. 1h, 2d, 2w)')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .action(async (options) => {
                await new GetAccessToken(program).execute(options);
        });
    program
        .command('list')
        .description('List configured profiles')
        .alias('l')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .action(async (options) => {
            await new ListProfilesCommand(program).execute(options);
        });
    program
        .command('describe <profileName>')
        .alias('get')
        .option('--color [boolean]', 'Turn on/off colors for JSON output.', 'true')
        .description('Describe a configured profile')
        .action(async (profileName, options) => {
            await new DescribeProfileCommand(program).execute({ profile: profileName, ...options });
        });
    program
        .command('env')
        .option('--profile <profile>', 'The profile to use')
        .option('--project <project>', 'The project to use')
        .option('--ttl <time>', 'The amount of time for this login to remain active, expressed as a number of hours, days, or weeks (e.g. 1h, 2d, 2w)', '1d')
        .description('Print cortex environment variables')
        .action(async (options) => {
            await new PrintEnvVars(program).execute(options);
        });
    program
        .command('set-profile <profileName>')
        .description('Sets the current profile.')
        .action(async (profileName, options) => {
            await new SetProfileCommand(program).execute(profileName, options);
        });
    return program;
}
if (esMain(import.meta)) {
    create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
