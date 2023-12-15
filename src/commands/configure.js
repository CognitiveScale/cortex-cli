import debugSetup from 'debug';
import _ from 'lodash';
import prompts from 'prompts';
import chalk from 'chalk';
import fs from 'node:fs';
import {
 readConfig, defaultConfig, generateJwt, loadProfile, durationRegex, 
} from '../config.js';
import { printSuccess, printError, useColor } from './utils.js';
import { getTimeoutUnit, getGotEnvOverrides } from '../client/apiutils.js';
/*
 * Copyright 2023 Cognitive Scale, Inc. All Rights Reserved.
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
const debug = debugSetup('cortex:cli');
function _validatePatFile(patFile) {
    if (!fs.existsSync(patFile)) {
        printError(`Personal Access Token file does not exist at: ${patFile}`);
    }
    return JSON.parse(fs.readFileSync(patFile));
}
export const ConfigureCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const { profile, file, project } = options;
        const config = readConfig();
        const profileName = profile || _.get(config, 'currentProfile', 'default');
        debug('configuring profile: %s', profileName);
        console.log(`Configuring profile ${chalk.green.bold(profileName)}:`);
        const cmd = this;
        try {
            let patData = null;
            if (file) {
                patData = _validatePatFile(file);
            } else {
                const { patjson } = await prompts({
                    type: 'text',
                    name: 'patjson',
                    message: 'Cortex Personal Access Config:',
                });
                patData = JSON.parse(patjson);
            }
            cmd.saveConfig(config, profileName, patData, project);
            console.log(`Configuration for profile ${chalk.green.bold(profileName)} saved.`);
        } catch (err) {
            printError(err);
        }
    }

    saveConfig(config, profileName, cfg, project) {
        if (!config) config = defaultConfig();
        config.setProfile(profileName, cfg, project);
        config.currentProfile = profileName;
        config.save();
    }
};
export const SetProfileCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(profileName, options) {
        const config = readConfig();
        const profile = await config.getProfile(profileName);
        if (profile === undefined) {
            printError(`No profile named ${profileName}.  Run cortex configure --profile ${profileName} to create it.`, options);
            return;
        }
        config.currentProfile = profileName;
        config.save();
        console.log(`Current profile set to ${chalk.green.bold(profileName)}`);
    }
};
export const DescribeProfileCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const config = readConfig();
        if (config === undefined) {
            printError('Configuration not found.  Please run "cortex configure".');
            return;
        }
        const profileName = options.profile || config.currentProfile;
        debug('describing profile: %s', profileName);
        const profile = await config.getProfile(profileName);
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
export const ListProfilesCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const config = readConfig();
        if (config === undefined) {
            printError('Configuration not found.  Please run "cortex configure".', options);
            return;
        }
        const profiles = Object.keys(config.profiles);
        profiles.forEach((name) => {
            if (name === config.currentProfile) {
                if (useColor(options)) {
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
export const GetAccessToken = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        const ttl = options.ttl || '1d';
        if (!durationRegex.test(ttl)) {
            printError(`Invalid --ttl "${ttl}" must be a number followed by ms,s,m,h,d,w,M,y`);
        }
        debug('%s.getAccesToken', profile.name);
        const jwt = await generateJwt(profile, ttl);
        return printSuccess(jwt, options);
    }
};
export const PrintEnvVars = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        try {
            // Token & URI are not picked from env variables, likely because
            // this command is meant to help the user configure their env based
            // on their profile.  Picking up env variables would be
            // inconsistent.
            const vars = [];
            const defaults = [];
            const profile = await loadProfile(options.profile, false);
            const ttl = options.ttl || '1d';
            if (!durationRegex.test(ttl)) {
                printError(`Invalid --ttl "${ttl}" must be a number followed by ms,s,m,h,d,w,M,y`);
            }
            const jwt = await generateJwt(profile, ttl);
            vars.push(`export CORTEX_TOKEN=${jwt}`);
            vars.push(`export CORTEX_URI=${profile.url}`);
            // not sure why we used URI previously ??
            vars.push(`export CORTEX_URL=${profile.url}`);
            vars.push(`export CORTEX_PROJECT=${options.project || profile.project}`);

            // Print timeout options, including time unit
            const { timeout, retry } = getGotEnvOverrides();
            const unit = getTimeoutUnit();
            const len = 60; // fixed length to apply consistent spacing
            timeout.forEach((t) => {
                if (t.userDefined) {
                    // Print the exact value set by the user & units
                    const unitPart = `# (unit: ${unit})`;
                    const exportPart = `export ${t.envVar}=${t.envValue}`;
                    const spacing = ' '.repeat(len - exportPart.length);
                    vars.push(`${exportPart}${spacing}${unitPart}`);
                } else {
                    // Print comment showing default & units
                    const defaultPart = `(default: ${t.defaultValue}, unit: ${unit})`;
                    const exportPart = `#export ${t.envVar}=`;
                    const spacing = ' '.repeat(len - exportPart.length);
                    defaults.push(`${exportPart}${spacing}${defaultPart}`);
                }
            });

            // Print retry options
            retry.forEach((v) => {
                if (v.userDefined) {
                    // Print the exact value set by the user
                    const exportPart = `export ${v.envVar}=${v.envValue}`;
                    vars.push(`${exportPart}`);
                } else {
                    // Print comment showing default
                    const defaultPart = `(default: ${v.defaultValue})`;
                    const exportPart = `#export ${v.envVar}=`;
                    const spacing = ' '.repeat(len - exportPart.length);
                    defaults.push(`${exportPart}${spacing}${defaultPart}`);
                }
            });
            vars.push('\n# The default value is used for the following environment variables:\n#', ...defaults);
            return printSuccess(vars.join('\n'), { color: 'off' });
        } catch (err) {
            return printError(err.message, {}, true);
        }
    }
};
