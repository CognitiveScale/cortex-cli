const path = require('path');
const URL = require('url-parse');
const {
  mkdir, writeFile,
} = require('fs/promises');
const minimatch = require('minimatch');
const inquirer = require('inquirer');
const ghGot = require('gh-got');
const { isText } = require('istextorbinary');
const treeify = require('treeify');

const _ = {
  get: require('lodash/get'),
  groupBy: require('lodash/groupBy'),
  orderBy: require('lodash/orderBy'),
  map: require('lodash/map'),
  filter: require('lodash/filter'),
  forEach: require('lodash/forEach'),
  template: require('lodash/template'),
  isEmpty: require('lodash/isEmpty'),
  set: require('lodash/set'),
  mean: require('lodash/mean'),
};

const { readConfig, loadProfile } = require('../../config');
const { 
  printToTerminal, 
  validateToken, 
} = require('./workspace-utils');

const { 
  printSuccess, 
  printError, 
  validateName,
  generateNameFromTitle,
} = require('../utils');

const METADATA_FILENAME = 'metadata.json';

module.exports.WorkspaceGenerateCommand = class WorkspaceGenerateCommand {
  constructor(program) {
    this.program = program;
  }

  async loadTemplateTree({ repo, branch, githubToken }) {
    printToTerminal('\x1b[0G\x1b[2KLoading templates...');

    this.gitRepo = repo;
    this.branch = branch;

    this.authorization = `${githubToken.token_type} ${githubToken.access_token}`;

    this.tree = await ghGot(`repos/${repo}/branches/${branch || 'main'}`, {
      headers: { authorization: this.authorization },
    })
      .then((resp) => resp.body)
      .then((resp) => ghGot(`repos/${repo}/git/trees/${resp.commit.sha}?recursive=true`, {
        headers: { authorization: this.authorization },
      }))
      .then((resp) => resp.body.tree)
      .catch((err) => {
        console.log('error: ', err);
        return [];
      });

    printToTerminal('\x1b[0G\x1b[2KTemplates loaded.\x1b[1E');
  }

  globTree(glob) {
    const filterFunc = minimatch.filter(glob, { matchBase: true });
    return _.filter(this.tree, (f) => f.type === 'blob' && filterFunc(f.path));
  }

  async readFile(filePath) {
    const response = await ghGot(`repos/${this.gitRepo}/contents/${filePath}?ref=${this.branch}`, {
      headers: { authorization: this.authorization },
    });
    return Buffer.from(response.body.content, 'base64');
  }

  async getRegistry() {
    const profile = await loadProfile();

    const registryUrl = _.get(this, 'options.registry')
      || _.get(profile, `registries['${profile.currentRegistry}'].url`)
      || (new URL(profile.url)).hostname.replace('api', 'private-registry');

    return registryUrl;
  }

  async selectTemplate() {
    const registryUrl = await this.getRegistry();
    const fileNames = this.globTree(METADATA_FILENAME);

    const choices = await Promise.all(_.map(fileNames, async (value) => {
      const data = JSON.parse((await this.readFile(value.path)).toString());
      return {
        name: data.title,
        value,
      };
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Select the template you want to use:',
        choices,
      },
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for the skill:',
        validate: (answer) => {
          const validation = validateName(answer);
          return validation.status || validation.message;
        },
      },
    ], {
      name: this.name,
      registry: registryUrl,
    }).catch(() => { });

    return answers;
  }

  async execute(name, destination, options) {
    this.options = options;
    this.name = name;
    this.destination = destination;

    this.config = readConfig();
    this.githubToken = await validateToken(this.config);

    if (!this.githubToken) {
      printError(
        this.config.templateConfig
          ? 'Github authorization is invalid. Running configuration now.\n'
          : 'Workspace generator is not configured. Running configuration now.\n',
        this.options, false,
      );
      await (new module.exports.WorkspaceConfigureCommand(this.program)).execute({ refresh: true });
      this.config = readConfig();
    }

    await this.loadTemplateTree(this.config.templateConfig);

    if (this.tree.length) {
      const template = await this.selectTemplate();
      if (template) {
        const templateFolder = path.posix.dirname(template.template.path);
        const templateFiles = this.globTree(`${templateFolder}/**`);
        const destinationPath = path.resolve(destination || process.cwd());
        const treeObj = {};

        console.log('');

        await Promise.all(
          _.map(templateFiles, async (f) => {
            try {
              const fileName = path.posix.basename(f.path);
              if (fileName !== METADATA_FILENAME) {
                const templateVars = {
                  skillname: generateNameFromTitle(template.name),
                  repo: { url: template.registry },
                };

                let buf = await this.readFile(f.path);
                /// Try not to template any non-text files.
                if (isText(null, buf)) {
                  buf = Buffer.from(
                    _.template(buf.toString(), { interpolate: /{{([\s\S]+?)}}/g })(templateVars),
                  );
                }

                const sourcePath = _.template(f.path.replace(/^templates\/[A-Za-z0-9- ]+\//, ''), { interpolate: /__([\s\S]+?)__/g })(templateVars);
                const targetPath = path.resolve(destinationPath, sourcePath);

                await mkdir(path.dirname(targetPath), { recursive: true });
                await writeFile(targetPath, buf);

                _.set(treeObj, sourcePath.split('/'), null);
              }
            } catch (err) {
              printError(`Error processing template file ${f.path}: ${err.message}`, this.options);
            }
          }),
        );
        if (!options || !options.notree) {
          printSuccess('Generated the following files:');
          console.log('');
          console.log(destinationPath);
          console.log(treeify.asTree(treeObj, true));
        }

        printSuccess('Workspace generation complete.');
      }
    } else {
      printError('Unable to retrieve templates', this.options);
    }
  }
};
