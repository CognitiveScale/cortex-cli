const glob = require('glob');
const path = require('path');
const Docker = require('dockerode');
const { readFile } = require('fs/promises');
const { v1: uuid } = require('uuid');
const inquirer = require('inquirer');
const cliProgress = require('cli-progress');
const { BarFormat } = require('cli-progress').Format;

const {
  parseObject,
} = require('../utils');

const { getSkillInfo, buildImageTag, getCurrentRegistry } = require('./workspace-utils');
const { loadProfile, generateJwt } = require('../../config');
const Catalog = require('../../client/catalog');
const Models = require('../../client/models');
const Content = require('../../client/content');
const Experiments = require('../../client/experiments');

const _ = {
  map: require('lodash/map'),
  find: require('lodash/find'),
  mean: require('lodash/mean'),
};

class DockerPushProgressTracker {
  constructor() {
    this.layers = { upload: {} };
    this.pushed = 0;
    this.result = {};

    this.bars = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: (opts, params, payload) => this.statusFormatter(opts, params, payload),
    }, cliProgress.Presets.shades_grey);

    this.pushBar = this.bars.create(100, 0, { type: 'upload' });
  }

  statusFormatter(barOpts, params, payload) {
    switch (payload.type) {
      case 'upload':
        if (params.progress >= 1) {
          return 'Pushing: Complete';
        }
        return `Pushing: [${BarFormat(params.progress, barOpts)}]`;
      case 'status':
        return `Status:      ${this.streamData.trim()}`;
      default:
        return '';
    }
  }

  updateProgress() {
    this.pushBar.update(this.pushed);
  }

  stop() {
    this.bars.stop();
  }

  complete() {
    this.pushed = 100;
    this.updateProgress();
    return this.result;
  }

  processEvent(evt) {
    const { progressDetail } = evt;
    let { status, id } = evt;

    if (evt.aux) {
      this.result = evt.aux;
    }

    status = status || '';
    id = id || '';

    if (evt.stream) {
      const newStr = evt.stream.replace(/\n|\r/g, '');
      if (newStr) {
        this.streamData = newStr;
      }
    }

    if ((status === 'Image up to date') || (status === 'Downloaded newer image')) {
      this.pushed = 100;
    }

    if (status === 'Preparing') {
      this.layers.upload[id] = { progress: 0 };
    }

    if (status === 'Pushing') {
      this.layers.upload[id].progress = progressDetail.current / progressDetail.total || 0;
    }

    if ((status === 'Pushed') || (status === 'Layer already exists')) {
      this.layers.upload[id].progress = 1;
    }

    const ulmap = _.map(this.layers.upload, 'progress');
    this.pushed = Math.round(100 * _.mean(ulmap));

    return this.updateProgress();
  }
}

module.exports.WorkspacePublishCommand = class WorkspacePublishCommand {
  constructor(program) {
    this.program = program;
  }

  async getRegistryAuth(profile, options) {
    const reg = await getCurrentRegistry();

    if (!profile.token) {
      if (reg.isCortex) {
        const ttl = options.ttl || '1d';
        const jwt = await generateJwt(profile, ttl);
        profile.token = jwt;
      } else {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'username',
            message: `Enter user name for ${reg.name}:`,
          },
          {
            type: 'password',
            name: 'password',
            message: `Enter password for ${reg.name}:`,
          },
        ]).catch(() => { });

        if (answers) {
          return answers;
        }
      }
    }

    return {
      username: 'cli',
      password: profile.token,
    };
  }

  async pushAction(action, imageTag, registryAuth) {
    let img = this.docker.getImage(imageTag);

    /// -------------------------------------
    /// RETAGGING IMAGE SO CORTEX PICKS IT UP
    /// The cortex backend has a bug where the new image wont be used if the tag hasnt changed
    /// Remove this when this problem is fixed.
    const buildId = uuid().substr(0, 6);
    const newTag = `${imageTag}:${buildId}`;
    await img.tag({ repo: newTag });
    img = this.docker.getImage(newTag);
    /// -------------------------------------

    const status = new DockerPushProgressTracker();

    const imgPush = await img
      .push({
        authconfig: registryAuth,
      })
      .catch((err) => Promise.reject(err));

    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(
        imgPush,
        (err) => {
          if (err) {
            return reject(err);
          }
          status.complete();
          status.stop();
          console.log(`Pushed action ${action.name}`);
          return resolve(true);
        },
        (evt) => {
          status.processEvent(evt);
        },
      );
    });
  }

  async execute(folder, options) {
    this.options = options;
    let target = process.cwd();

    if (folder) {
      const fldr = folder.replace(/'|"/g, '');
      target = path.isAbsolute(fldr) ? folder : path.resolve(target, fldr);
    }

    if (options.skill) {
      target = path.join(target, 'skills', options.skill, 'skill.yaml');
    }

    const skillInfo = await getSkillInfo(target);

    if (skillInfo.length > 0) {
      const profile = await loadProfile();

      this.docker = new Docker();

      this.catalogClient = new Catalog(profile.url);
      this.modelsClient = new Models(profile.url);
      this.experimentClient = new Experiments(profile.url);
      this.contentClient = new Content(profile.url);

      await Promise.all(_.map(skillInfo, async (info) => {
        const skillName = info.skill.name;
        const actions = info.skill.actions ? info.skill.actions : [];
        await Promise.all(_.map(actions, async (action) => {
          const tag = await buildImageTag(action.image);
          const imglist = await this.docker.listImages({
            filters: JSON.stringify({
              reference: [tag],
            }),
          });

          if (imglist.length !== 0) {
            try {
              const globOpts = {
                root: target,
                absolute: true,
              };
              const regAuth = await this.getRegistryAuth(profile, action.image, options);

                const typesFiles = glob.sync(`types/${skillName}/**/*.yaml`, globOpts);
                await Promise.all(
                  _.map(typesFiles, async (f) => {
                    const typeData = await readFile(f).catch(() => { });
                    if (typeData) {
                      const type = parseObject(typeData.toString());
                      let normalizedType = {};
                      if (!('types' in type)) normalizedType.types = [type];
                      else normalizedType = type;
                      await this.catalogClient.saveType(profile.project, profile.token, normalizedType);
                      console.log(`Published type ${path.basename(f)}`);
                    }
                  }),
                );

                const modelsFiles = glob.sync(`models/${skillName}/**/*.yaml`, globOpts);
                await Promise.all(
                  _.map(modelsFiles, async (f) => {
                    const modelData = await readFile(f).catch(() => { });
                    if (modelData) {
                      const model = parseObject(modelData.toString());
                      await this.modelsClient.saveModel(profile.project, profile.token, model);
                      console.log(`Published model ${model.name}`);
                    }
                  }),
                );

                const experimentsFiles = glob.sync(`experiments/${skillName}/*/*.yaml`, globOpts);
                await Promise.all(
                  _.map(experimentsFiles, async (expFile) => {
                    const experimentData = await readFile(expFile).catch(() => { });

                    if (experimentData) {
                      const experiment = parseObject(experimentData.toString());

                      const result = await this.experimentClient.saveExperiment(profile.project, profile.token, experiment).then((response) => response.success)
                        .catch(() => false);

                      if (result) {
                        console.log(`Published experiment ${experiment.name}`);
                        const runsFiles = glob.sync(`experiments/${skillName}/${experiment.name}/runs/**/*.yaml`, globOpts);
                        await Promise.all(
                          _.map(runsFiles, async (runFile) => {
                            const runData = await readFile(runFile).catch(() => { });

                            if (runData) {
                              const run = parseObject(runData.toString());
                              ///
                              /// Note:  I would prefer to do an Update operation here instead, but the update endpoint
                              ///        for experiment runs is currently broken.
                              ///
                              ///        In the interim, I just delete the run (if it exists) and then re-add it.
                              ///
                              await this.experimentClient.deleteRun(profile.project, profile.token, experiment.name, run.runId);
                              run.experimentName = experiment.name;
                              await this.experimentClient.createRun(profile.project, profile.token, run);
                              console.log(`Published run ${run.runId}`);

                              const artifacts = glob.sync(`experiments/${skillName}/${experiment.name}/runs/${run.runId}/artifacts/*`, globOpts);
                              await Promise.all(_.map(artifacts, async (artifactUri) => {
                                const artifactName = path.basename(artifactUri).split('.')[0];
                                await this.experimentClient.uploadArtifact(profile.project, profile.token, experiment.name, run.runId, artifactUri, artifactName);
                                console.log(`Published artifact ${artifactName}`);
                              }));
                            }
                          }),
                        );
                      } else {
                        console.error('Failed to save experiment');
                      }
                    }
                  }),
                );

                const contentFolder = path.join(target, 'content');
                const contentFiles = glob.sync('**/*', { cwd: contentFolder, nodir: true, absolute: false });
                await Promise.all(
                  _.map(contentFiles, async (f) => {
                    const filePath = path.join(contentFolder, f);
                    const key = `${path.posix.dirname(f)}/${path.posix.basename(f, path.posix.extname(f))}`;
                    await this.contentClient.uploadContentStreaming(profile.project, profile.token, key, filePath);
                    console.log(`Published content ${key}`);
                  }),
                );

              await this.pushAction(action, tag, regAuth);
            } catch (err) {
              console.error(err.message);
            }
          } else {
            console.error(`No image found for action ${action.name}.  Has it been built?`);
          }
        }));

        this.catalogClient.saveSkill(profile.project, profile.token, info.skill);
      }));

      return Promise.resolve();
    }

    console.log('No skills found');
    return Promise.resolve();
  }
};
