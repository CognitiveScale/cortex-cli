const path = require('path');
const inquirer = require('inquirer');

const _ = {
  map: require('lodash/map'),
  filter: require('lodash/filter'),
  forEach: require('lodash/forEach'),
  find: require('lodash/find'),
};

const { loadProfile, readConfig } = require('../../config');
const { printSuccess, printError } = require('../utils');

module.exports.WorkspaceAddRegistryCommand = class WorkspaceAddRegistryCommand {
  constructor(program) {
    this.program = program;
  }

  async execute(name, opts) {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Name for registry: ',
      },
      {
        type: 'input',
        name: 'url',
        message: 'Registry URL:      ',
        default: 'docker.io',
      },
      {
        type: 'input',
        name: 'namespace',
        message: 'Namespace:         ',
      },
    ], {
      name,
      url: opts.url,
      namespace: opts.namespace,
    })
      .then(async (answers) => {
        const profile = await loadProfile();

        profile.registries[answers.name] = {
          name: answers.name,
          url: answers.url,
          namespace: answers.namespace,
        };

        const cfg = readConfig();
        cfg.profiles[profile.name] = profile;
        cfg.save();

        printSuccess(`Registry ${answers.name} added`, opts);
      })
      .catch((error) => {
        printError(error.message, opts);
      });
  }
};

module.exports.WorkspaceRemoveRegistryCommand = class WorkspaceRemoveRegistryCommand {
  constructor(program) {
    this.program = program;
  }

  async execute(name, options) {
    const profile = await loadProfile();

    /// Use a function iteratee instead of the property test
    const choices = _.map(_.filter(profile.registries, (r) => !r.isCortex && (!name || name === r.name)), (r) => (
      {
        name: r.name,
        value: r.name,
      }));

    if (choices.length === 0) {
      printError(name ? `Registry ${name} not found` : 'No registries found to remove', options);
      return;
    }

    await inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: 'Select registry to remove: ',
        choices,
      },
    ], {
      name,
    })
      .then((answers) => {
        delete profile.registries[answers.name];

        const cfg = readConfig();
        cfg.profiles[profile.name] = profile;
        cfg.save();

        printSuccess(`Registry ${answers.name} removed`, options);
      })
      .catch((error) => {
        printError(error.message, options);
      });
  }
};

module.exports.WorkspaceActivateRegistryCommand = class WorkspaceActivateRegistryCommand {
  constructor(program) {
    this.program = program;
  }

  async execute(name, options) {
    const profile = await loadProfile();

    const choices = _.map(_.filter(profile.registries, (r) => !name || (r.name === name)), (r) => (
      {
        name: r.name,
        value: r.name,
      }));

    if (choices.length === 0) {
      printError(name ? `Registry ${name} not found` : 'No registries found to activate', options);
      return;
    }

    await inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: 'Select registry to activate: ',
        choices,
      },
    ], {
      name,
    })
      .then((answers) => {
        profile.currentRegistry = answers.name;

        const cfg = readConfig();
        cfg.profiles[profile.name] = profile;
        cfg.save();

        printSuccess(`Registry ${answers.name} activated`, options);
      })
      .catch((error) => {
        printError(error.message, options);
      });
  }
};

module.exports.WorkspaceListRegistryCommand = class WorkspaceListRegistryCommand {
  constructor(program) {
    this.program = program;
  }

  async execute(options) {
    const profile = await loadProfile();
    _.forEach(profile.registries, (r) => {
      const logStr = `${r.name} - ${path.posix.join(r.url, r.namespace || '')}`;
      if (r.name === profile.currentRegistry) {
        printSuccess(logStr, options);
      } else {
        console.log(logStr);
      }
    });
  }
};
