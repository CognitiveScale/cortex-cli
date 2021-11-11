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
const Joi = require('@hapi/joi');
const debug = require('debug')('cortex:config');
const { parseJwk } = require('jose-node-cjs-runtime/jwk/parse');
const { SignJWT } = require('jose-node-cjs-runtime/jwt/sign');
const { printError } = require('./commands/utils');

function configDir() {
    return process.env.CORTEX_CONFIG_DIR || path.join(os.homedir(), '.cortex');
}

async function generateJwt(profile, expiresIn = '2m') {
    const {
        username, issuer, audience, jwk,
    } = profile;
    const jwtSigner = await parseJwk(jwk, 'Ed25519');
    return new SignJWT({})
        .setProtectedHeader({ alg: 'EdDSA', kid: jwk.kid })
        .setSubject(username)
        .setAudience(audience)
        .setIssuer(issuer)
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(jwtSigner, { kid: jwk.kid });
}

const ProfileSchema = Joi.object().keys({
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
        templateConfig,
    }) {
        this.version = version || '3';
        this.profiles = profiles || {};
        this.currentProfile = currentProfile;
        this.templateConfig = templateConfig;
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
            url, username, issuer, audience, jwk, project,
    }) {
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
            templateConfig: this.templateConfig, 
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

function defaultConfig() {
    return new Config({});
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

            if (configObj.version && configObj.version === '3') {
                // version 3
                return new Config(configObj);
            }
            fs.copyFileSync(configFile, path.join(dir, 'config_v2'));
            defaultConfig().save();
            printError('Old profile found and moved to ~/.cortex/config_v2. Please run "cortex configure"');

            if (configObj.version && configObj.version === '2') {
                // version 2
                return new Config(configObj);
            }

            // version 1
            return new Config({ profiles: configObj });
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
    loadProfile,
    generateJwt,
    defaultConfig,
    readConfig,
};
