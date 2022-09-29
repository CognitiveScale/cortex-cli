const _ = require('lodash');
const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const fs = require('fs');
const os = require('os');
const {
  stat,
  readFile, 
} = require('fs/promises');
const { statSync } = require('fs');
const ghGot = require('gh-got');

const { configDir } = require('../../config');
const {
  printWarning,
} = require('../utils');

let keytar;
// Is loading keytar fails, use headless fallback for secrets..
try {
  // Don't load keytar for tests
  if (process.env.NODE_ENV !== 'test') {
    keytar = require('keytar');
  }
} catch (err) {
  printWarning(`Unable to use keyring service, falling back to file-based keystore: ${err.message}`);
}

const { loadProfile } = require('../../config');
const buffer = require("buffer");

const CORTEX_CLI_AUTH_ID = 'cortex-cli:github';
const CORTEX_CLI_AUTH_USER = 'cortex-cli';

async function getPasswordHeaded() {
  return await keytar.getPassword(CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER);
}

function readLocaFile() {
  const dataFile = path.join(configDir(), 'cache.dat');
  // nothing stored
  if (!fs.existsSync(dataFile)) return {};
  const rawData = fs.readFileSync(dataFile);
  const decoded = Buffer.from(rawData.toString(), 'base64').toString();
  return JSON.parse(decoded);
}

async function getPasswordHeadless() {
  return _.get(readLocaFile(),[CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER]);
}

async function storePasswordHeaded(val) {
  await keytar.setPassword(CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER, val);
}

async function storePasswordHeadless(val) {
  const dataFile = path.join(configDir(), 'cache.dat');
  const originaldata = readLocaFile();
  const updated = _.set(originaldata, [CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER],  val);
  fs.writeFileSync(dataFile, Buffer.from(JSON.stringify(updated)).toString('base64'));
}


module.exports.validateToken = async function validateToken() {
  try {
    let authorization;
    if (keytar !== undefined) {
      authorization = await getPasswordHeaded();
    } else {
      authorization = await getPasswordHeadless();
    }
    if (authorization) {
      const u = await ghGot('user', { headers: { authorization } })
      if (u?.statusCode === 200)
        return authorization;
    }
  } catch (err) {
    console.error(err.message)
  }
  return undefined;
};

module.exports.persistToken = async function persistToken(token) {
  const val = `${token.token_type} ${token.access_token}`
  if (keytar) {
    return storePasswordHeaded(val);
  }
  return storePasswordHeadless(val);
};

module.exports.printToTerminal = function printToTerminal(txt) {
  process.stdout.write(`${txt}\x1b[0K\x1b[1E`);
};

module.exports.saveTerminalPosition = function saveTerminalPosition() {
  process.stdout.write('\x1b7');
};

module.exports.restoreTerminalPosition = function saveTerminalPosition() {
  process.stdout.write('\x1b8');
};

module.exports.getSkillInfo = function getSkillInfo(target) {
  let skillFiles = [];
  if (target.endsWith('skill.yaml')) {
    skillFiles = statSync(path.resolve(target)) ? [target] : [];
  } else {
    skillFiles = glob.sync('./skills/**/skill.yaml', {
      root: target,
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
};

module.exports.getCurrentRegistry = async function getCurrentRegistry(profile = undefined) {
  const regProfile = profile || await loadProfile(); // old behavior was always getting "current" profile
  return regProfile.registries[regProfile.currentRegistry];
};

module.exports.buildImageTag = async function buildImageTag(profile, actionName) {
  if (actionName.includes('/')) {
    return actionName;
  }

  const registry = await module.exports.getCurrentRegistry(profile);
  if (registry.url.includes('docker.io')) {
    return path.posix.join(registry.namespace || '', actionName);
  }

  return path.posix.join(registry.url, registry.namespace || '', actionName);
};
