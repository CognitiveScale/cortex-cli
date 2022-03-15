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

const _ = require('lodash');
const os = require('os');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const moment = require('moment');
const debug = require('debug')('cortex:config');
const jose = require('jose-node-cjs-runtime');
const { printError } = require('./commands/utils');
const Info = require('./client/info');

function configDir() {
    return process.env.CORTEX_CONFIG_DIR || path.join(os.homedir(), '.cortex');
}

const durationRegex = /^([.\d]+)([smhdwMy])$/;
async function generateJwt(profile, expiresIn = '2m') {
    const {
        username, issuer, audience, jwk,
    } = profile;
    const jwtSigner = await jose.importJWK(jwk, 'Ed25519');
    const infoClient = new Info(profile.url);
    const infoResp = await infoClient.getInfo();
    const serverTs = _.get(infoResp, 'serverTs', Date.now());
    const [, amount, unit] = durationRegex.exec(expiresIn);
    const expiry = moment(serverTs).add(_.toNumber(amount), unit).unix();
    return new jose.SignJWT({})
        .setProtectedHeader({ alg: 'EdDSA', kid: jwk.kid })
        .setSubject(username)
        .setAudience(audience)
        .setIssuer(issuer)
        .setIssuedAt(Math.floor(serverTs / 1000)) // in seconds
        .setExpirationTime(expiry)
        .sign(jwtSigner, { kid: jwk.kid });
}

const ProfileSchema = Joi.object({
    name: Joi.string().optional(),
    url: Joi.string().uri().required(),
    username: Joi.string().required(),
    // deprecated
    account: Joi.string().optional(),
    jwk: Joi.any().required(),
    issuer: Joi.string().required(),
    audience: Joi.string().required(),
    token: Joi.string().optional(),
    project: Joi.string().optional(),
});

const ProfileSchemaV4 = Joi.object().keys({
    name: Joi.string().optional(),
    url: Joi.string().uri().required(),
    username: Joi.string().required(),
    // deprecated
    account: Joi.string().optional(),
    jwk: Joi.any().required(),
    issuer: Joi.string().required(),
    audience: Joi.string().required(),
    token: Joi.string().optional(),
    project: Joi.string().optional(),
    registries: Joi.any().required(),
    currentRegistry: Joi.string().required(),
});

class Profile {
    constructor(name, {
 url, username, issuer, audience, jwk, project,
}) {
        this.name = name;
        this.url = url;
        this.username = username;
        this.jwk = jwk;
        this.issuer = issuer;
        this.audience = audience;
        this.project = project;
    }

    validate() {
        const { error } = ProfileSchema.validate(this, { abortEarly: false });
        if (error) {
            throw new Error(`Invalid configuration profile <${this.name}>: ${error.details[0].message}. `
                + 'Please get your Personal Access Token from the Cortex Console and run "cortex configure".');
        }
        return this;
    }

    toJSON() {
        return {
            url: this.url,
            username: this.username,
            issuer: this.issuer,
            audience: this.audience,
            jwk: this.jwk,
            project: this.project,
        };
    }
}

class Config {
    constructor({ 
        version, 
        profiles, 
        currentProfile,
    }) {
        this.version = version || '3';
        this.profiles = profiles || {};
        this.currentProfile = currentProfile;
        Object.keys(this.profiles).forEach((name) => {
            this.profiles[name] = new Profile(name, this.profiles[name]);
        });
    }

    async getProfile(name, useenv = true) {
        const profile = this.profiles[name];
        if (!profile) {
            return undefined;
        }
        const profileType = new Profile(name, profile).validate();
        if (useenv) {
            profileType.url = process.env.CORTEX_URI || profileType.url;
        }
        profileType.token = await generateJwt(profile);
        return profileType;
    }

    setProfile(name, {
            url, username, issuer, audience, jwk,
    }, project) {
        const profile = new Profile(name, {
             url, username, issuer, audience, jwk, project,
        });
        profile.validate(); // do not set/save invalid profiles ..
        this.profiles[name] = profile;
    }

    toJSON() {
        const profiles = {};
        Object.keys(this.profiles).forEach((name) => {
            profiles[name] = this.profiles[name].toJSON();
        });
        return { 
            version: this.version, 
            profiles, 
            currentProfile: this.currentProfile, 
        };
    }

    save() {
        const dir = configDir();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        _.forEach(this.profiles, (profile) => {
            delete profile.token;
        });

        const configFile = path.join(dir, 'config');
        fs.writeFileSync(configFile, JSON.stringify(this.toJSON(), null, 2));
    }
}

class ProfileV4 {
    constructor(name, {
 url, username, issuer, audience, jwk, project, registries, currentRegistry,
}) {
        this.name = name;
        this.url = url;
        this.username = username;
        this.jwk = jwk;
        this.issuer = issuer;
        this.audience = audience;
        this.project = project;
        this.registries = registries || {
            'Cortex Private Registry': {
                url: new URL(url).hostname.replace('api', 'private-registry'),
                name: 'Cortex Private Registry',
                isCortex: true,
            },
        };
        this.currentRegistry = currentRegistry || 'Cortex Private Registry';
    }

    validate() {
        const { error } = ProfileSchemaV4.validate(this, { abortEarly: false });
        if (error) {
            throw new Error(`Invalid configuration profile <${this.name}>: ${error.details[0].message}. `
                + 'Please get your Personal Access Token from the Cortex Console and run "cortex configure".');
        }
        return this;
    }

    toJSON() {
        return {
            url: this.url,
            username: this.username,
            issuer: this.issuer,
            audience: this.audience,
            jwk: this.jwk,
            project: this.project,
            registries: this.registries,
            currentRegistry: this.currentRegistry,
        };
    }
}

class ConfigV4 {
    constructor({ 
        profiles,
        currentProfile, 
        templateConfig,
    }) {
        this.version = '4';
        this.profiles = profiles || {};
        this.currentProfile = currentProfile;
        Object.keys(this.profiles).forEach((name) => {
            this.profiles[name] = new ProfileV4(name, this.profiles[name]);
        });
        this.templateConfig = templateConfig || {
            repo: 'CognitiveScale/cortex-code-templates',
            branch: 'main',
        };
    }

    setProfile(name, {
        url, username, issuer, audience, jwk, registries, currentRegistry,
    }, project) {
        const profile = new ProfileV4(name, {
            url, username, issuer, audience, jwk, project, registries, currentRegistry,
        });
        profile.validate(); // do not set/save invalid profiles ..
        this.profiles[name] = profile;
    }

    toJSON() {
        const profiles = {};
        Object.keys(this.profiles).forEach((name) => {
            profiles[name] = this.profiles[name].toJSON();
        });
        return { 
            version: this.version, 
            profiles, 
            currentProfile: this.currentProfile, 
            templateConfig: this.templateConfig, 
        };
    }

    async getProfile(name, useenv = true) {
        const profile = this.profiles[name];
        if (!profile) {
            return undefined;
        }
        const profileType = new ProfileV4(name, profile).validate();
        if (useenv) {
            profileType.url = process.env.CORTEX_URI || profileType.url;
        }
        profileType.token = await generateJwt(profile);
        return profileType;
    }

    save() {
        const dir = configDir();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        _.forEach(this.profiles, (profile) => {
            delete profile.token;
        });

        const configFile = path.join(dir, 'config');
        fs.writeFileSync(configFile, JSON.stringify(this.toJSON(), null, 2));
    }
}

function defaultConfig() {
    return new ConfigV4({});
}

function readConfig() {
    try {
        const dir = configDir();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        debug(`Reading config from ${dir}`);

        const configFile = path.join(dir, 'config');
        if (fs.existsSync(configFile)) {
            // deal with config versions
            const configObj = JSON.parse(fs.readFileSync(configFile));

            if (configObj.version) {
                switch (configObj.version) {
                    case '4':
                        return new ConfigV4(configObj);

                    case '3':
                        {
                            // version 4 (template config support, with github token)
                            // Upgrade v3 to v4
                            const cfg = new ConfigV4(configObj);
                            cfg.save();
                            return cfg;
                        }

                    case '2':
                        fs.copyFileSync(configFile, path.join(dir, 'config_v2'));
                        defaultConfig().save();
                        printError('Old profile found and moved to ~/.cortex/config_v2. Please run "cortex configure"');
                        // version 2
                        return new Config(configObj);
            
                    default:
                        // version 1
                        return new Config({ profiles: configObj });
                }
            }
        }
    } catch (err) {
        throw new Error(`Unable to load config: ${err.message}`);
    }
    return undefined;
}

async function loadProfile(profileName, useenv = true) {
    const config = readConfig();
    if (config === undefined) {
        throw new Error('Please configure the Cortex CLI by running "cortex configure"');
    }

    const name = profileName || config.currentProfile || 'default';
    const profile = await config.getProfile(name, useenv);
    if (!profile) {
        throw new Error(`Profile with name "${name}" could not be located in your configuration.  Please run "cortex configure".`);
    }
    return profile;
}

module.exports = {
    durationRegex,
    loadProfile,
    generateJwt,
    defaultConfig,
    readConfig,
};
