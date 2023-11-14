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
import { getDefaultFeatures } from './features.js';

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

async function computeJwt(profile, serverTs, expiresIn = '2m') {
    const {
        username, issuer, audience, jwk,
    } = profile;
    const alg = jwk?.alg || 'EdDSA';
    const jwtSigner = await jose.importJWK(jwk, alg);
    const [, amount, unit] = durationRegex.exec(expiresIn);
    const expiry = dayjs(serverTs).add(_.toNumber(amount), unit).unix();
    return new jose.SignJWT({})
        .setProtectedHeader({ alg, kid: jwk.kid })
        .setSubject(username)
        .setAudience(audience)
        .setIssuer(issuer)
        .setIssuedAt(Math.floor(serverTs / 1000)) // in seconds
        .setExpirationTime(expiry)
        .sign(jwtSigner, { kid: jwk.kid });
}

async function fetchInfoForProfile(profile, expiresIn = '2m') {
    const infoClient = new Info(profile.url);
    const infoResp = await infoClient.getInfo();
    const serverTs = infoResp?.serverTs ?? Date.now();
    const featureFlags = infoResp?.featureFlags ?? getDefaultFeatures();
    const jwt = await computeJwt(profile, serverTs, expiresIn);
    return { jwt, featureFlags };
}

async function generateJwt(profile, expiresIn = '2m') {
    const { jwt } = await fetchInfoForProfile(profile, expiresIn);
    return jwt;
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
    featureFlags: Joi.object().optional(),
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
    featureFlags: Joi.object().optional(),
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
    featureFlags: Joi.object().optional(),
});
class Profile {
    constructor(name, {
 url, username, issuer, audience, jwk, project, featureFlags,
}) {
        this.name = name;
        this.url = url;
        this.username = username;
        this.jwk = jwk;
        this.issuer = issuer;
        this.audience = audience;
        this.project = project;
        this.featureFlags = featureFlags;
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
            featureFlags: this.featureFlags,
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
        // Side load JWT & Feature Flags - this is used to avoid redundant calls
        // to the Info API (`fetchInfoForProfile()`).
        if (process.env.CORTEX_TOKEN_SILENT) {
            profileType.token = process.env.CORTEX_TOKEN_SILENT;
            debug('Side loaded token from previous info request');
        }
        if (process.env.CORTEX_FEATURE_FLAGS) {
            try {
                profileType.featureFlags = JSON.parse(process.env.CORTEX_FEATURE_FLAGS);
                debug('Side loaded feature flags token from previous info request');
            } catch (err) {
                // fail silently - let feature flags to be retrieved later
                debug(`Failed to side loaded feature flags token from previous info request - ${err}`);
            }
        }
        // Load user facing environment variables - these have higher priority than
        // the above (silent) options.
        if (useenv) {
            let jwtFromEnv;
            if (process.env.CORTEX_TOKEN) {
                jwtFromEnv = process.env.CORTEX_TOKEN;
                printError('Using token from "CORTEX_TOKEN" environment variable', {}, false);
            }
            profileType.url = getCortexUrlFromEnv() || profileType.url;
            profileType.token = jwtFromEnv || profileType.token;
            profileType.project = process.env.CORTEX_PROJECT || profileType.project;
        }
        // In the case that either value is missing, call the Info API
        if (!profileType.token || !profileType.featureFlags) {
            debug(`JWT or Feature Flags is not defined - making info request - ${profileType.token}, ${profileType.featureFlags}`);
            const { jwt, featureFlags } = await fetchInfoForProfile(profile);
            profileType.token = jwt;
            profileType.featureFlags = featureFlags || getDefaultFeatures();
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
 url, username, issuer, audience, jwk, project, registries, currentRegistry, featureFlags,
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
        this.featureFlags = featureFlags;
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
        // Side load JWT & Feature Flags - this is used to avoid redundant calls
        // to the Info API (`fetchInfoForProfile()`).
        if (process.env.CORTEX_TOKEN_SILENT) {
            profileType.token = process.env.CORTEX_TOKEN_SILENT;
            debug('Side loaded token from previous info request');
        }
        if (process.env.CORTEX_FEATURE_FLAGS) {
            try {
                profileType.featureFlags = JSON.parse(process.env.CORTEX_FEATURE_FLAGS);
                debug('Side loaded feature flags token from previous info request');
            } catch (err) {
                // fail silently - let feature flags to be retrieved again
                debug(`Failed to side loaded feature flags token from previous info request - ${err}`);
            }
        }
        // Load user facing environment variables - these have higher priority than
        // the above (silent) options.
        if (useenv) {
            let jwtFromEnv;
            if (process.env.CORTEX_TOKEN) {
                jwtFromEnv = process.env.CORTEX_TOKEN;
                printError('Using token from "CORTEX_TOKEN" environment variable', {}, false);
            }
            profileType.url = getCortexUrlFromEnv() || profileType.url;
            profileType.token = jwtFromEnv || profileType.token;
            profileType.project = process.env.CORTEX_PROJECT || profileType.project;
        }
        // In the case that either value is missing, call the Info API
        if (!profileType.token || !profileType.featureFlags) {
            debug(`JWT or Feature Flags is not defined - making info request - ${profileType.token}, ${profileType.featureFlags}`);
            const { jwt, featureFlags } = await fetchInfoForProfile(profile);
            profileType.token = jwt;
            profileType.featureFlags = featureFlags || getDefaultFeatures();
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
 url, username, issuer, audience, jwk, project, registries, currentRegistry, templateConfig, featureFlags,
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
        this.featureFlags = featureFlags;
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
            featureFlags: this.featureFlags, // TODO: is featureFlags needed as a field?
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
        // Side load JWT & Feature Flags - this is used to avoid redundant calls
        // to the Info API (`fetchInfoForProfile()`).
        if (process.env.CORTEX_TOKEN_SILENT) {
            profileType.token = process.env.CORTEX_TOKEN_SILENT;
            debug('Side loaded token from previous info request');
        }
        if (process.env.CORTEX_FEATURE_FLAGS) {
            try {
                profileType.featureFlags = JSON.parse(process.env.CORTEX_FEATURE_FLAGS);
                debug('Side loaded feature flags token from previous info request');
            } catch (err) {
                // fail silently - let feature flags to be retrieved again
                debug(`Failed to side loaded feature flags token from previous info request - ${err}`);
            }
        }
        // Load user facing environment variables - these have higher priority than
        // the above (silent) options.
        if (useenv) {
            let jwtFromEnv;
            if (process.env.CORTEX_TOKEN) {
                jwtFromEnv = process.env.CORTEX_TOKEN;
                printError('Using token from "CORTEX_TOKEN" environment variable', {}, false);
            }
            profileType.url = getCortexUrlFromEnv() || profileType.url;
            profileType.token = jwtFromEnv || profileType.token;
            profileType.project = process.env.CORTEX_PROJECT || profileType.project;
        }
        // In the case that either value is missing, call the Info API
        if (!profileType.token || !profileType.featureFlags) {
            debug(`JWT or Feature Flags is not defined - making info request - ${profileType.token}, ${profileType.featureFlags}`);
            const { jwt, featureFlags } = await fetchInfoForProfile(profile);
            profileType.token = jwt;
            profileType.featureFlags = featureFlags || getDefaultFeatures();
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
    debug(`loadProfile() => ${profileName} (using env: ${useenv})`);
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
export { fetchInfoForProfile };
export { defaultConfig };
export { configDir };
export { readConfig };
export default {
    durationRegex,
    loadProfile,
    defaultConfig,
    configDir,
    readConfig,
    fetchInfoForProfile,
};
