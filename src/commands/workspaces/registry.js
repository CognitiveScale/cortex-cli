import path from 'path';
import inquirer from 'inquirer';
import _ from 'lodash';
import { loadProfile, readConfig } from '../../config.js';
import { printSuccess, printError } from '../utils.js';

export class WorkspaceAddRegistryCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(name, opts) {
        await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Name for registry: ',
            },
            {
                type: 'input',
                name: 'url',
                message: 'Registry URL:      ',
                default: 'docker.io',
            },
            {
                type: 'input',
                name: 'namespace',
                message: 'Namespace:         ',
            },
        ], {
            name,
            url: opts.url,
            namespace: opts.namespace,
        })
            .then(async (answers) => {
            const profile = await loadProfile(opts.profile);
            profile.registries[answers.name] = {
                name: answers.name,
                url: answers.url,
                namespace: answers.namespace,
            };
            const cfg = readConfig();
            cfg.profiles[profile.name] = profile;
            cfg.save();
            printSuccess(`Registry ${answers.name} added`, opts);
        })
            .catch((error) => {
            printError(error.message, opts);
        });
    }
}
export class WorkspaceRemoveRegistryCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        const profile = await loadProfile(options.profile);
        /// Use a function iteratee instead of the property test
        const choices = _.map(_.filter(profile.registries, (r) => !r.isCortex && (!name || name === r.name)), (r) => ({
            name: r.name,
            value: r.name,
        }));
        if (choices.length === 0) {
            printError(name ? `Registry ${name} not found` : 'No registries found to remove', options);
            return;
        }
        await inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: 'Select registry to remove: ',
                choices,
            },
        ], {
            name,
        })
            .then((answers) => {
            delete profile.registries[answers.name];
            const cfg = readConfig();
            cfg.profiles[profile.name] = profile;
            cfg.save();
            printSuccess(`Registry ${answers.name} removed`, options);
        })
            .catch((error) => {
            printError(error.message, options);
        });
    }
}
export class WorkspaceActivateRegistryCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(regname, options) {
        const name = regname || undefined;
        const profile = await loadProfile(options.profile);
        const choices = _.map(_.filter(profile.registries, (r) => !name || (r.name === name)), (r) => ({
            name: r.name,
            value: r.name,
        }));
        if (choices.length === 0) {
            printError(name ? `Registry ${name} not found` : 'No registries found to activate', options);
            return;
        }
        await inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: 'Select registry to activate: ',
                choices,
            },
        ], {
            name,
        })
            .then((answers) => {
            profile.currentRegistry = answers.name;
            const cfg = readConfig();
            cfg.profiles[profile.name] = profile;
            cfg.save();
            printSuccess(`Registry ${answers.name} activated`, options);
        })
            .catch((error) => {
            printError(error.message, options);
        });
    }
}
export class WorkspaceListRegistryCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        _.forEach(profile.registries, (r) => {
            const logStr = `${r.name} - ${path.posix.join(r.url, r.namespace || '')}`;
            if (r.name === profile.currentRegistry) {
                printSuccess(logStr, options);
            } else {
                console.log(logStr);
            }
        });
    }
}
