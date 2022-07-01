const inquirer = require('inquirer');
const chalk = require('chalk');
const got = require('got');
const open = require('open');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const { validateToken, persistToken } = require('./workspace-utils');

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

const { readConfig } = require('../../config');
const { printSuccess, printError, useColor } = require('../utils');

dayjs.extend(relativeTime);

const GITHUB_APP_CLIENTID = 'Iv1.e0e84c2a5fa7c935';
const DEFAULT_TEMPLATE_REPO = 'CognitiveScale/cortex-code-templates';
const DEFAULT_TEMPLATE_BRANCH = 'main';

const GITHUB_DEVICECODE_REQUEST_URL = 'https://github.com/login/device/code';
const GITHUB_DEVICECODE_RESPONSE_URL = 'https://github.com/login/oauth/access_token';

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
        const githubToken = await validateToken();

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

              const mom = dayjs().add(expiry, 'seconds');

              (function poller(options) {
                process.stdout.write(`\x1b[0GPlease enter the following code to authorize the Cortex CLI: ${useColor(options)
                  ? chalk.bgBlackBright.whiteBright(`[ ${deviceCode.user_code} ]`)
                  : deviceCode.user_code
                  }  ${dayjs(mom.diff()).format(' [( Expires in] mm [minutes and] ss [seconds ) - CTRL-C to abort]')}`);

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
                    persistToken(accessToken);
                    config.templateConfig = answers;
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
