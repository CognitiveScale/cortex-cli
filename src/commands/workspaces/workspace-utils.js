const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const {
  readFile, stat,
} = require('fs/promises');

const ghGot = require('gh-got');

const _ = {
  get: require('lodash/get'),
  map: require('lodash/map'),
  mean: require('lodash/mean'),
};

const { loadProfile } = require('../../config');

module.exports.validateToken = function validateToken(config) {
  const githubToken = _.get(config, 'templateConfig.githubToken');
  if (githubToken) {
    return ghGot('user', { token: githubToken.access_token }).catch(() => undefined).then((u) => ((u && u.statusCode === 200) ? githubToken.access_token : undefined));
  }
  return undefined;
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
  if (target.endsWith('skill.yaml')) {
    const fname = path.resolve(target);
    return stat(fname)
      .then(() => [fname])
      .catch(() => []);
  }
  const skillFiles = glob.sync('/skills/**/skill.yaml', {
    root: target,
    absolute: true,
  });
  return Promise.all(_.map(skillFiles, async (uri) => {
    const skill = await readFile(uri).catch(() => { });
    return {
      name: path.basename(uri),
      uri,
      skill: skill ? yaml.load(skill.toString()) : undefined,
    };
  }));
};

module.exports.getCurrentRegistry = async function getCurrentRegistry() {
  const profile = await loadProfile();
  return profile.registries[profile.currentRegistry];
};

module.exports.buildImageTag = async function buildImageTag(actionName) {
  const registry = await module.exports.getCurrentRegistry();
  if (registry.url.includes('docker.io')) {
    return path.posix.join(registry.namespace || '', actionName);
  }

  if (actionName.startsWith(registry.url)) {
    return actionName;
  }

  return path.posix.join(registry.url, registry.namespace || '', actionName);
};
