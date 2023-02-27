import _ from 'lodash';
import path from 'path';
import glob from 'glob';
import yaml from 'js-yaml';
import {
 existsSync, readFileSync, writeFileSync, statSync, 
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import ghGot from 'gh-got';
import { configDir, loadProfile } from '../../config.js';
import { printWarning } from '../utils.js';

let keytar;
// Is loading keytar fails, use headless fallback for secrets..
try {
    // Don't load keytar for tests
    if (process.env.NODE_ENV !== 'test') {
        keytar = await import('keytar');
    }
} catch (err) {
    printWarning(`Unable to use keyring service, falling back to file-based keystore: ${err.message}`);
}
const CORTEX_CLI_AUTH_ID = 'cortex-cli:github';
const CORTEX_CLI_AUTH_USER = 'cortex-cli';

// eslint-disable-next-line require-await
async function getPasswordHeaded() {
    return keytar.getPassword(CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER);
}
function readLocaFile() {
    const dataFile = path.join(configDir(), 'cache.dat');
    // nothing stored
    if (!existsSync(dataFile)) return {};
    const rawData = readFileSync(dataFile);
    const decoded = Buffer.from(rawData.toString(), 'base64').toString();
    return JSON.parse(decoded);
}
function getPasswordHeadless() {
    return _.get(readLocaFile(), [CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER]);
}
async function storePasswordHeaded(val) {
    await keytar.setPassword(CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER, val);
}
function storePasswordHeadless(val) {
    const dataFile = path.join(configDir(), 'cache.dat');
    const originaldata = readLocaFile();
    const updated = _.set(originaldata, [CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER], val);
    writeFileSync(dataFile, Buffer.from(JSON.stringify(updated)).toString('base64'));
}
export async function validateToken() {
    try {
        let authorization;
        if (keytar !== undefined) {
            authorization = await getPasswordHeaded();
        } else {
            authorization = await getPasswordHeadless();
        }
        if (authorization) {
            const u = await ghGot('user', { headers: { authorization } });
            if (u?.statusCode === 200) return authorization;
        }
    } catch (err) {
        console.error(err.message);
    }
    return undefined;
}
// eslint-disable-next-line require-await
export async function persistToken(token) {
    const val = `${token.token_type} ${token.access_token}`;
    if (keytar) {
        return storePasswordHeaded(val);
    }
    return storePasswordHeadless(val);
}

export function printToTerminal(txt) {
    process.stdout.write(`${txt}\x1b[0K\x1b[1E`);
}

export function saveTerminalPosition() {
    process.stdout.write('\x1b7');
}

export function restoreTerminalPosition() {
    process.stdout.write('\x1b8');
}

export function getSkillInfo(target) {
    let skillFiles = [];
    if (target.endsWith('skill.yaml')) {
        skillFiles = statSync(path.resolve(target)) ? [target] : [];
    } else {
        skillFiles = glob.sync('./skills/**/skill.yaml', {
            cwd: target,
            absolute: true,
        });
    }
    return Promise.all(_.map(skillFiles, async (uri) => {
        const skill = await readFile(uri).catch((err) => { console.error(`Unable to open skill: ${err.message}`); });
        return {
            name: path.basename(uri),
            uri,
            skill: skill ? yaml.load(skill.toString()) : undefined,
        };
    }));
}
export async function getCurrentRegistry(profile = undefined) {
    const regProfile = profile || await loadProfile(); // old behavior was always getting "current" profile
    return regProfile.registries[regProfile.currentRegistry];
}
export async function buildImageTag(profile, actionName) {
    if (actionName.includes('/')) {
        return actionName;
    }
    const registry = await getCurrentRegistry(profile);
    if (registry.url.includes('docker.io')) {
        return path.posix.join(registry.namespace || '', actionName);
    }
    return path.posix.join(registry.url, registry.namespace || '', actionName);
}
