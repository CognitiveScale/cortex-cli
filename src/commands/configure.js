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

const debug = require('debug')('cortex:cli');
const _ = require('lodash');
const prompt = require('prompt');
const chalk = require('chalk');
const fs = require('fs');

const {
    readConfig,
    defaultConfig,
    generateJwt,
    loadProfile,
} = require('../config');
const { printSuccess, printError } = require('./utils');

function _validatePatFile(patFile) {
    if (!fs.existsSync(patFile)) {
        printError(`Personal Access Token file does not exist at: ${patFile}`);
    }
    return JSON.parse(fs.readFileSync(patFile));
}

prompt.message = '';
prompt.delimeter = '';
prompt.colors = false;
module.exports.ConfigureCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute() {
        const { profile, file, project } = this.program.opts();
        const config = readConfig();
        const profileName = profile || _.get(config, 'currentProfile', 'default');

        debug('configuring profile: %s', profileName);
        console.log(`Configuring profile ${chalk.green.bold(profileName)}:`);

        const cmd = this;
//        co(function* () {
            try {
                let patData = null;
                if (file) {
                    patData = _validatePatFile(file);
                } else {
                    const { patjson } = await prompt.get([{
                        name: 'patjson',
                        required: true,
                        description: 'Cortex Personal Access Config',
                    }]);
                    patData = JSON.parse(patjson);
                }
                cmd.saveConfig(config, profileName, patData, project);
                console.log(`Configuration for profile ${chalk.green.bold(profileName)} saved.`);
                process.exit(0); //
            } catch (err) {
                printError(err);
            }
 //       });
    }

    saveConfig(config, profileName, {
         url, username, issuer, audience, jwk,
    }, project) {
        if (!config) config = defaultConfig();
        config.setProfile(profileName, {
            url, username, issuer, audience, jwk, project,
        });
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
            printError('Configuration not found.  Please run "cortex configure".');
            return;
        }

        const profileName = options.profile || config.currentProfile;
        debug('describing profile: %s', profileName);

        const profile = config.getProfile(profileName);
        if (profile === undefined) {
            printError(`No profile named ${profileName}.  Run cortex configure --profile ${profileName} to create it.`, options);
            return;
        }

        printSuccess(`Profile: ${profile.name}`, options);
        printSuccess(`Cortex URL: ${profile.url}`, options);
        printSuccess(`Username: ${profile.username}`, options);
        printSuccess(`JWK: ${JSON.stringify(profile.jwk)}`, options);
        printSuccess(`Project: ${profile.project || 'undefined'}`, options);
    }
};

module.exports.ListProfilesCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute() {
        const options = this.program.opts();
        const config = readConfig();
        if (config === undefined) {
            printError('Configuration not found.  Please run "cortex configure".', options);
            return;
        }

        const profiles = Object.keys(config.profiles);
        profiles.forEach((name) => {
            if (name === config.currentProfile) {
                if (options.color === 'on') {
                    console.log(chalk.green.bold(name));
                } else {
                    console.log(`${name} [active]`);
                }
            } else {
                console.log(name);
            }
        });
    }
};

module.exports.GetAccessToken = class {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        const ttl = options.ttl || '1d';
        debug('%s.getAccesToken', profile.name);
        const jwt = generateJwt(profile, ttl);
        return printSuccess(jwt, options);
    }
};

module.exports.PrintEnvVars = class {
    constructor(program) {
        this.program = program;
    }

    execute() {
        const vars = [];
        const options = this.program;
        const profile = loadProfile(options.profile, false);
        const ttl = options.ttl || '1d';
        const jwt = generateJwt(profile, ttl);
        vars.push(`export CORTEX_TOKEN=${jwt}`);
        vars.push(`export CORTEX_URI=${profile.url}`);
        // not sure why we used URI previously ??
        vars.push(`export CORTEX_URL=${profile.url}`);
        vars.push(`export CORTEX_PROJECT=${options.project || profile.project}`);
        return printSuccess(vars.join('\n'), options);
    }
};
