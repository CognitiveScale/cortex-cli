const os = require('os');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('cortex:cli');
const co = require('co');
const prompt = require('co-prompt');
const chalk = require('chalk');
const Auth = require('../client/auth');
const { readConfig, writeConfig } = require('../config');
const { printSuccess, printError } = require('./utils');

const DEFAULT_CORTEX_URL = 'https://api.cortex.insights.ai';

module.exports.ConfigureCommand = class ConfigureCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('configuring profile: %s', options.profile);
        
        const config = readConfig();
        const profile = config[options.profile] || {};
        const cmd = this;
        
        co(function*(){
            const defaultCortexUrl = profile.url || DEFAULT_CORTEX_URL;
            const defaultAccount = profile.tenantId || '';
            const defaultUsername = profile.username || '';

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
                cmd.saveConfig(options.profile, cortexUrl, account, username, token);
                console.log(chalk.green('Configuration saved'));
            }
            catch (e) {
                console.error(chalk.red(`LOGIN FAILED: ${e.message}`));
            }
        });
    }

    saveConfig(profile, url, account, username, token) {
        const config = readConfig();
        config[profile] = {
            tenantId: account,
            username: username,
            token: token,
            url: url
        }

        writeConfig(config);
    }
};

module.exports.ListConfigurationCommand = class ListConfigurationCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('listing configuration for profile: %s', options.profile);
        
        const config = readConfig();
        const profile = config[options.profile];

        if (profile === undefined) {
            printError(`No profile named ${options.profile}.  Run cortex configure --profile ${options.profile} to create it.`, options);
            return;
        }

        printSuccess(`Profile: ${options.profile}`, options);
        printSuccess(`Cortex URL: ${profile.url}`, options);
        printSuccess(`Account: ${profile.tenantId}`, options);
        printSuccess(`Username: ${profile.username}`, options);
    }
};