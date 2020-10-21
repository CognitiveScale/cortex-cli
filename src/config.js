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

const _ = require('lodash');
const os = require('os');
const fs = require('fs');
const path = require('path');
const Joi = require('@hapi/joi');
const debug = require('debug')('cortex:config');
const { JWT, JWK } = require('jose');
const { printError } = require('./commands/utils');

function generateJwt(profile) {
    const { username, issuer, audience,jwk } = profile;
    const jwtSigner = JWK.asKey(jwk);
    const payload = {
    };
    return JWT.sign(payload, jwtSigner, {
        issuer: issuer,
        audience: audience,
        subject: username,
        expiresIn: '2m',
    });
}

module.exports.defaultConfig = defaultConfig = function(){
  return new Config({});
};

module.exports.readConfig = readConfig = function() {
    const configDir = process.env.CORTEX_CONFIG_DIR || path.join(os.homedir(), '.cortex');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    debug(`Reading config from ${configDir}`);

    const configFile = path.join(configDir, 'config');
    if (fs.existsSync(configFile)) {
        // deal with config versions
        const configObj = JSON.parse(fs.readFileSync(configFile));

        if (configObj.version && configObj.version === '3') {
            // version 3
            // debug('loaded v3 config: %o', configObj);
            return new Config(configObj);
        } else {
            fs.copyFileSync(configFile, path.join(configDir, 'config_v2'))
            defaultConfig().save();
            printError('Old profile found and moved to ~/.cortex/config_v2. Please run "cortex configure"');
        }

        if (configObj.version && configObj.version === '2') {
            // version 2
            // debug('loaded v2 config: %o', configObj);
            return new Config(configObj);
        }

        // version 1
        // debug('loaded v1 config: %o', configObj);
        return new Config({profiles: configObj});
    }

    return undefined;
};

const ProfileSchema = Joi.object().keys({
    name: Joi.string().optional(),
    url: Joi.string().uri().required(),
    username: Joi.string().required(),
    account: Joi.string().required(),
    jwk: Joi.any().required(),
    issuer: Joi.string().required(),
    audience: Joi.string().required(),
    token: Joi.string().optional(),
    project: Joi.string().optional()
});

class Profile {

    constructor(name, {url, username, issuer, audience, jwk, project}) {
        this.name = name;
        this.url = process.env.CORTEX_URI || url;
        this.username = username;
        this.jwk = jwk;
        this.account = 'cortex';
        this.issuer = issuer;
        this.audience = audience;
        this.project = project;
    }

    validate() {
        const {error, value} = ProfileSchema.validate(this,{abortEarly: false});
        if (error) {
            throw new Error(`Invalid configuration profile <${this.name}>: ${error.details[0].message}. ` +
                `Please get your Personal Access Token from the Cortex Console and run "cortex configure".`);
        }
        return this;
    }
    toJSON() {
        return {url: this.url, username: this.username, issuer: this.issuer, audience: this.audience,
            jwk: this.jwk, project: this.project};
    }
}

class Config {

    constructor({version, profiles, currentProfile}) {
        this.version = version || '3';
        this.profiles = profiles || {};
        this.currentProfile = currentProfile;

        for (let name of Object.keys(this.profiles)) {
            this.profiles[name] = new Profile(name, this.profiles[name]);
        }
    }

    getProfile(name) {
        const profile = this.profiles[name];
        if (!profile) {
            return undefined;
        }
        const profileType = new Profile(name, profile).validate();
        profileType.token = generateJwt(profile);
        return profileType;
    }

    setProfile(name, {url, username, issuer, audience, jwk, project}) {
        const profile = new Profile(name, {url, username, issuer, audience, jwk, project});
        profile.validate(); // do not set/save invalid profiles ..
        this.profiles[name] = profile
    }

    toJSON() {
        const profiles = {};
        for (let name of Object.keys(this.profiles)) {
            profiles[name] = this.profiles[name].toJSON();
        }

        return {version: this.version, profiles: profiles, currentProfile: this.currentProfile};
    }

    save() {
        const configDir = path.join(os.homedir(), '.cortex');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir);
        }

        _.forEach(this.profiles, function(profile) {
            delete profile.token;
        });

        const configFile = path.join(configDir, 'config');
        fs.writeFileSync(configFile, JSON.stringify(this.toJSON(), null, 2));
    }
}

module.exports.loadProfile = function(profileName) {
    const config = readConfig();
    if (config === undefined) {
        throw new Error(`Please configure the Cortex CLI by running "cortex configure"`);
    }

    const name = profileName || config.currentProfile || 'default';
    const profile = config.getProfile(name);
    if (!profile) {
        throw new Error(`Profile with name "${name}" could not be located in your configuration.  Please run "cortex configure".`);
    }
    return profile;
};
