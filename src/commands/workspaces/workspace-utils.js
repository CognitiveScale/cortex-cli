const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const {
  readFile, 
} = require('fs/promises');
const { statSync } = require('fs');
const ghGot = require('gh-got');

const _ = {
  get: require('lodash/get'),
  map: require('lodash/map'),
  mean: require('lodash/mean'),
};

const keytar = require('keytar');

const { loadProfile } = require('../../config');

const CORTEX_CLI_AUTH_ID = 'cortex-cli:github';
const CORTEX_CLI_AUTH_USER = 'cortex-cli';

module.exports.validateToken = async function validateToken() {
  const authorization = await keytar.getPassword(CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER);
  if (authorization) {
    return ghGot('user', { headers: { authorization } }).catch(() => undefined).then((u) => ((u && u.statusCode === 200) ? authorization : undefined));
  }
  return undefined;
};

module.exports.persistToken = async function persistToken(token) {
  await keytar.setPassword(CORTEX_CLI_AUTH_ID, CORTEX_CLI_AUTH_USER, `${token.token_type} ${token.access_token}`);
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
