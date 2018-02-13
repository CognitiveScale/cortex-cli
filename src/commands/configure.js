/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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

const debug = require('debug')('cortex:cli');
const co = require('co');
const prompt = require('co-prompt');
const chalk = require('chalk');
const Auth = require('../client/auth');
const { readConfig, writeConfig, defaultConfig } = require('../config');
const { printSuccess, printError } = require('./utils');

const DEFAULT_CORTEX_URL = 'https://api.cortex.insights.ai';

module.exports.ConfigureCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const config = readConfig();
        const profileName = options.profile || (config && config.currentProfile) || 'default';
        debug('configuring profile: %s', profileName);

        const profile = (config && config.getProfile(profileName)) || {};
        const cmd = this;

        co(function*(){
            const defaultCortexUrl = profile.url || DEFAULT_CORTEX_URL;
            const defaultAccount = profile.account || '';
            const defaultUsername = profile.username || '';

            console.log(`Configuring profile ${chalk.green.bold(profileName)}:`);
            let cortexUrl = yield prompt(`Cortex URL [${defaultCortexUrl}]: `);
            let account = yield prompt(`Account [${defaultAccount}]: `);
            let username = yield prompt(`Username [${defaultUsername}]: `);
            const password = yield prompt.password('Password: ');

            cortexUrl = cortexUrl || defaultCortexUrl;
            account = account || defaultAccount;
            username = username || defaultUsername;

            debug('cortexUrl: %s', cortexUrl);
            debug('account: %s', account);
            debug('username: %s', username);

            if (!cortexUrl) {
                console.error(chalk.red('Cortex URL must be provided'));
                return;
            }

            if (!account) {
                console.error(chalk.red('Cortex account name must be provided'));
                return;
            }

            if (!username) {
                console.error(chalk.red('Cortex username must be provided'));
                return;
            }

            const auth = new Auth(cortexUrl);
            try {
                const token = yield auth.login(account, username, password);
                debug('token: %s', token);
                cmd.saveConfig(config, profileName, cortexUrl, account, username, token);
                console.log(`Configuration for profile ${chalk.green.bold(profileName)} saved.`);
            }
            catch (e) {
                console.error(chalk.red(`LOGIN FAILED: ${e.message}`));
            }
        });
    }
    saveConfig(config, profileName, url, account, username, token) {
        if(!config)
          config = defaultConfig();
        config.setProfile(profileName, {url, account, username, token});
        config.currentProfile = profileName;
        config.save();
    }
};

module.exports.SetProfileCommand = class {
    constructor(program) {
        this.program = program;
    }
    execute(profileName, options) {
        const config = readConfig();
        const profile = config.getProfile(profileName);
        if (profile === undefined) {
            printError(`No profile named ${profileName}.  Run cortex configure --profile ${profileName} to create it.`, options);
            return;
        }

        config.currentProfile = profileName;
        config.save();

        console.log(`Current profile set to ${chalk.green.bold(profileName)}`);
    }
};

module.exports.DescribeProfileCommand = class {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const config = readConfig();
        if (config === undefined) {
            printError(`Configuration not found.  Please run "cortex configure".`);
            return;
        }

        const profileName = config.currentProfile || options.profile;
        debug('describing profile: %s', profileName);

        const profile = config.getProfile(profileName);
        if (profile === undefined) {
            printError(`No profile named ${profileName}.  Run cortex configure --profile ${profileName} to create it.`, options);
            return;
        }

        printSuccess(`Profile: ${profile.name}`, options);
        printSuccess(`Cortex URL: ${profile.url}`, options);
        printSuccess(`Account: ${profile.account}`, options);
        printSuccess(`Username: ${profile.username}`, options);
    }
};

module.exports.ListProfilesCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const config = readConfig();
        if (config === undefined) {
            printError(`Configuration not found.  Please run "cortex configure".`,options);
            return;
        }

        const profiles = Object.keys(config.profiles);
        for (let name of profiles) {
            if (name === config.currentProfile) {
                if (options.color === 'on') {
                    console.log(chalk.green.bold(name));
                }
                else {
                    console.log(`${name} [active]`);
                }
            }
            else {
                console.log(name);
            }
        }
    }
};
