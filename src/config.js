import _ from 'lodash';
import os from 'os';
import fs from 'node:fs';
import path from 'path';
import Joi from 'joi';
import dayjs from 'dayjs';
import debugSetup from 'debug';
import * as jose from 'jose';
import { printError } from './commands/utils.js';
import Info from './client/info.js';

const debug = debugSetup('cortex:config');
function configDir() {
    return process.env.CORTEX_CONFIG_DIR || path.join(os.homedir(), '.cortex');
}
// TODO deprecate CORTEX_URI
function getCortexUrlFromEnv() {
    if (process.env.CORTEX_URI) {
        return process.env.CORTEX_URI;
    }
    return process.env.CORTEX_URL;
}
const durationRegex = /^([.\d]+)(ms|[smhdwMy])$/;
async function generateJwt(profile, expiresIn = '2m') {
    const {
 username, issuer, audience, jwk, 
} = profile;
    const jwtSigner = await jose.importJWK(jwk, 'Ed25519');
    const infoClient = new Info(profile.url);
    const infoResp = await infoClient.getInfo();
    const serverTs = _.get(infoResp, 'serverTs', Date.now());
    const [, amount, unit] = durationRegex.exec(expiresIn);
    const expiry = dayjs(serverTs).add(_.toNumber(amount), unit).unix();
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
const ProfileSchemaV5 = Joi.object().keys({
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
    templateConfig: Joi.any().required(),
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
    constructor({ version, profiles, currentProfile }) {
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
            if (process.env.CORTEX_TOKEN) {
                printError('Using token from "CORTEX_TOKEN" environment variable', {}, false);
            }
            profileType.url = getCortexUrlFromEnv() || profileType.url;
            profileType.token = process.env.CORTEX_TOKEN || await generateJwt(profile);
            profileType.project = process.env.CORTEX_PROJECT || profileType.project;
        } else {
            profileType.token = await generateJwt(profile);
        }
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
            printError(`Invalid configuration profile <${this.name}>: ${error.details[0].message}. `
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
    constructor({ profiles, currentProfile, templateConfig }) {
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
            if (process.env.CORTEX_TOKEN) {
                printError('Using token from "CORTEX_TOKEN" environment variable', {}, false);
            }
            profileType.url = getCortexUrlFromEnv() || profileType.url;
            profileType.token = process.env.CORTEX_TOKEN || await generateJwt(profileType);
            profileType.project = process.env.CORTEX_PROJECT || profileType.project;
        } else {
            profileType.token = await generateJwt(profileType);
        }
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
class ProfileV5 {
    constructor(name, {
 url, username, issuer, audience, jwk, project, registries, currentRegistry, templateConfig, 
}, templateConfigV4) {
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
        this.templateConfig = templateConfig || templateConfigV4 || {
            repo: 'CognitiveScale/cortex-code-templates',
            branch: 'main',
        };
    }

    validate() {
        const { error } = ProfileSchemaV5.validate(this, { abortEarly: false });
        if (error) {
            printError(`Invalid configuration profile <${this.name}>: ${error.details[0].message}. `
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
            templateConfig: this.templateConfig,
        };
    }
}
class ConfigV5 {
    constructor({ profiles, currentProfile, templateConfig }) {
        this.version = '5';
        this.profiles = profiles || {};
        this.currentProfile = currentProfile;
        Object.keys(this.profiles).forEach((name) => {
            this.profiles[name] = new ProfileV5(name, this.profiles[name], templateConfig);
        });
    }

    setProfile(name, {
 url, username, issuer, audience, jwk, registries, currentRegistry, templateConfig, 
}, project) {
        const profile = new ProfileV5(name, {
            url, username, issuer, audience, jwk, project, registries, currentRegistry, templateConfig,
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

    async getProfile(name, useenv = true) {
        const profile = this.profiles[name];
        if (!profile) {
            return undefined;
        }
        const profileType = new ProfileV5(name, profile).validate();
        if (useenv) {
            if (process.env.CORTEX_TOKEN) {
                printError('Using token from "CORTEX_TOKEN" environment variable', {}, false);
            }
            profileType.url = getCortexUrlFromEnv() || profileType.url;
            profileType.token = process.env.CORTEX_TOKEN || await generateJwt(profileType);
            profileType.project = process.env.CORTEX_PROJECT || profileType.project;
        } else {
            profileType.token = await generateJwt(profileType);
        }
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
    return new ConfigV5({});
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
                    case '5':
                        return new ConfigV5(configObj);
                    case '4':
                        {
                            // version 5 (per-profile template support)
                            // Upgrade v4 to v5
                            const cfg = new ConfigV5(configObj);
                            cfg.save();
                            return cfg;
                        }
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
        printError('Please configure the Cortex CLI by running "cortex configure"');
    }
    const name = profileName || config.currentProfile || 'default';
    const profile = await config.getProfile(name, useenv);
    if (!profile) {
        printError(`Profile with name "${name}" could not be located in your configuration.  Please run "cortex configure".`);
    }
    return profile;
}
export { durationRegex };
export { loadProfile };
export { generateJwt };
export { defaultConfig };
export { configDir };
export { readConfig };
export default {
    durationRegex,
    loadProfile,
    generateJwt,
    defaultConfig,
    configDir,
    readConfig,
};
