const path = require('path');
const URL = require('url-parse');
const { mkdir, writeFile } = require('fs/promises');
const minimatch = require('minimatch');
const inquirer = require('inquirer');
const chalk = require('chalk');
const got = require('got');
const ghGot = require('gh-got');
const open = require('open');
const moment = require('moment');
const { isText } = require('istextorbinary');
const treeify = require('treeify');

const _ = {
  get: require('lodash/get'),
  groupBy: require('lodash/groupBy'),
  map: require('lodash/map'),
  filter: require('lodash/filter'),
  forEach: require('lodash/forEach'),
  template: require('lodash/template'),
  isEmpty: require('lodash/isEmpty'),
  set: require('lodash/set'),
};

const { readConfig, loadProfile } = require('../config');
const { printSuccess, printError } = require('./utils');

const { generateNameFromTitle, validateName } = require('./utils');

const GITHUB_APP_CLIENTID = 'Iv1.e0e84c2a5fa7c935';
const METADATA_FILENAME = 'metadata.json';
const DEFAULT_TEMPLATE_REPO = 'CognitiveScale/cortex-code-templates';
const DEFAULT_TEMPLATE_BRANCH = 'main';

const GITHUB_DEVICECODE_REQUEST_URL = 'https://github.com/login/device/code';
const GITHUB_DEVICECODE_RESPONSE_URL = 'https://github.com/login/oauth/access_token';

function validateToken(config) {
  const githubToken = _.get(config, 'templateConfig.githubToken');
  if (githubToken) {
    return ghGot('user', { token: githubToken.access_token }).catch(() => undefined).then((u) => ((u && u.statusCode === 200) ? githubToken.access_token : undefined));
  }
  return undefined;
}

module.exports.WorkspaceConfigureCommand = class WorkspaceConfigureCommand {
  constructor(program) {
    this.program = program;
  }

  async execute(opts) {
    this.options = opts;

    const config = readConfig();

    await inquirer.prompt([
      {
        type: 'input',
        name: 'repo',
        message: 'Template Repository URL:   ',
        default: _.get(config, 'templateConfig.repo', DEFAULT_TEMPLATE_REPO),
      },
      {
        type: 'input',
        name: 'branch',
        message: 'Template Repository Branch:',
        default: _.get(config, 'templateConfig.branch', DEFAULT_TEMPLATE_BRANCH),
      },
    ])
      .then(async (answers) => {
        let githubToken = await validateToken(config);

        if (!githubToken && !this.options.refresh) {
          printError('Current Github credentials invalid.  Reauthorization required.', this.options, false);
        }

        if (!githubToken || this.options.refresh) {
          const { body: deviceCode } = await got.post(GITHUB_DEVICECODE_REQUEST_URL, {
            json: {
              client_id: GITHUB_APP_CLIENTID,
            },
            responseType: 'json',
            headers: {
              Accept: 'application/json',
            },
          });

          if (deviceCode) {
            console.log(`Opening browser at ${deviceCode.verification_uri}`);
            await open(deviceCode.verification_uri);

            await new Promise((resolve, reject) => {
              let expiry = deviceCode.expires_in;
              let pollInterval = deviceCode.interval;
              let accessToken;

              const mom = moment().add(expiry, 'seconds');

              (function poller(options) {
                process.stdout.write(`\x1b[0GPlease enter the following code to authorize the Cortex CLI: ${options.color === 'on' ? chalk.bgBlackBright.whiteBright(`[ ${deviceCode.user_code} ]`) : deviceCode.user_code
                  }`);
                process.stdout.write(
                  moment(mom.diff()).format(' [( Expires in] mm [minutes and] ss [seconds ) - CTRL-C to abort]'),
                );

                const pollTimer = setTimeout(async () => {
                  const { body } = await got.post(GITHUB_DEVICECODE_RESPONSE_URL, {
                    json: {
                      client_id: GITHUB_APP_CLIENTID,
                      device_code: deviceCode.device_code,
                      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                    },
                    responseType: 'json',
                    headers: {
                      Accept: 'application/json',
                    },
                  });
                  accessToken = body;

                  if (accessToken.access_token) {
                    clearTimeout(pollTimer);
                    githubToken = accessToken;
                    config.templateConfig = {
                      ...answers,
                      githubToken,
                    };
                    config.save();
                    printSuccess('\x1b[0G\x1b[2KGithub token configuration successful.', options);
                    resolve();
                  } else {
                    switch (accessToken.error) {
                      case 'authorization_pending':
                        expiry = Math.max(expiry - pollInterval, 0);
                        break;

                      case 'slow_down':
                        pollInterval += 5;
                        break;

                      case 'expired_token':
                        clearInterval(pollTimer);
                        printError('\x1b[0G\x1b[2KAccess code entry expired.  Please re-run configure and try again.', options);
                        reject();
                        return;

                      case 'incorrect_device_code':
                        printError('\x1b[0G\x1b[2KIncorrect Device Code entered.', options);
                        reject();
                        return;

                      case 'access_denied':
                        clearInterval(pollTimer);
                        printError('\x1b[0G\x1b[2KAccess denied by user.', options);
                        reject();
                        return;

                      default:
                        clearInterval(pollTimer);
                        printError(`\x1b[0G\x1b[2KAuthorization error: ${accessToken.error}.  Please re-run configure and try again.`, options);
                        reject();
                        return;
                    }
                    poller(options);
                  }
                }, (pollInterval) * 1000);
              }(this.options));
            });
          } else {
            printError('\x1b[2KDevice Code request failed.  Please try again.', this.options);
          }
        }
      })
      .catch((error) => {
        printError(error.message, this.options);
      });
  }
};

module.exports.WorkspaceGenerateCommand = class WorkspaceGenerateCommand {
  constructor(program) {
    this.program = program;
  }

  async loadTemplateTree({ repo, branch, githubToken }) {
    process.stdout.write('\x1b[0G\x1b[2KLoading templates...');

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

    process.stdout.write('\x1b[0G\x1b[2KTemplates loaded.\x1b[1E');
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
    const registryUrl = _.get(this, 'options.registry', (new URL(profile.url)).hostname.replace('api', 'private-registry'));
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
      {
        type: 'input',
        name: 'registry',
        message: 'Specify the Docker registry in which to publish the skills:',
        default: registryUrl,
      },
    ], {
      name: this.name,
      registry: _.get(this, 'options.registry', undefined),
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
