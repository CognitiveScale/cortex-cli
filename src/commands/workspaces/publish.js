import { globSync } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import Docker from 'dockerode';
import { readFile } from 'node:fs/promises';
import { v1 as uuid } from 'uuid';
import inquirer from 'inquirer';
import cliProgress from 'cli-progress';
import chalk from 'chalk';
import _ from 'lodash';
import { parseObject, printSuccess, printError } from '../utils.js';
import { getSkillInfo, buildImageTag, getCurrentRegistry } from './workspace-utils.js';
import { loadProfile, generateJwt } from '../../config.js';
import Catalog from '../../client/catalog.js';
import Models from '../../client/models.js';
import Content from '../../client/content.js';
import Experiments from '../../client/experiments.js';
import ApiServerClient from '../../client/apiServerClient.js';

const { BarFormat } = cliProgress.Format;

class DockerPushProgressTracker {
    constructor() {
        this.layers = { upload: {} };
        this.pushed = 0;
        this.result = {};
        this.stage = '';
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
                    return chalk.green(`Pushing ${this.stage}: Complete`);
                }
                return chalk.green(`Pushing ${this.stage}: [${BarFormat(params.progress, barOpts)}]`);
            case 'status':
                return chalk.green(`Status:      ${this.streamData.trim()}`);
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

    processEvent(evt, imgtag) {
        const { progressDetail } = evt;
        let { status, id } = evt;
        if (imgtag) {
            this.stage = imgtag;
        }
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
export default class WorkspacePublishCommand {
    constructor(program) {
        this.program = program;
        this.docker = new Docker();
    }

    async getRegistryAuth(profile, options) {
        const reg = await getCurrentRegistry(profile);
        if (!profile.token) {
            if (reg.isCortex) {
                const ttl = options.ttl || '1d';
                profile.token = await generateJwt(profile, ttl);
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

    async pushAction(action, imageTag, registryAuth, { skipPush }) {
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
        // Set image tag to new image tag for skill/action deployment later
        // eslint-disable-next-line no-param-reassign
        action.image = newTag;
        if (skipPush) {
            printSuccess(`Skipping docker push for: ${newTag}`);
            return true;
        }
        const status = new DockerPushProgressTracker();
        const imgPush = await img
            .push({
            authconfig: registryAuth,
        });
        return new Promise((resolve, reject) => {
            this.docker.modem.followProgress(imgPush, (err) => {
                if (err) {
                    return reject(err);
                }
                status.complete();
                status.stop();
                return resolve(true);
            }, (evt) => {
                if (evt.error) {
                    status.stop();
                    reject(new Error(evt.error));
                    return;
                }
                status.processEvent(evt, newTag);
            });
        });
    }

    async execute(folder, options) {
        this.options = options;
        let target = process.cwd();
        try {
            if (folder) {
                const fldr = folder.replace(/'|"/g, '');
                target = path.isAbsolute(fldr) ? folder : path.resolve(target, fldr);
            }
            if (options.skill) {
                target = path.join(target, 'skills', options.skill, 'skill.yaml');
                if (!fs.existsSync(target)) {
                    throw new Error(`Skill ${options.skill} not found!`);
                }
            }
            const skillInfo = await getSkillInfo(target);
            if (skillInfo.length > 0) {
                const profile = await loadProfile(options.profile);
                /// If the user passed in a project name, validate it with the cluster
                let project = options.project || profile.project;
                if (project) {
                    const apiServer = new ApiServerClient(profile.url);
                    await apiServer.getProject(profile.token, project)
                        .then((prj) => project = prj.name)
                        .catch(() => printError(`Project ${project} not found.`, options));
                } else {
                    throw new Error('Project must be specified');
                }
                this.catalogClient = new Catalog(profile.url);
                this.modelsClient = new Models(profile.url);
                this.experimentClient = new Experiments(profile.url);
                this.contentClient = new Content(profile.url);
                const published = await Promise.all(_.map(skillInfo, async (info) => {
                    const skillName = info.skill.name;
                    const actions = info.skill.actions ? info.skill.actions : [];
                    const actionsPublished = await Promise.all(_.map(actions, async (action) => {
                        const tag = await buildImageTag(profile, action.image);
                        const imglist = await this.docker.listImages({
                            filters: JSON.stringify({
                                reference: [tag],
                            }),
                        });
                        if (imglist.length !== 0) {
                            const globOpts = {
                                cwd: target,
                                absolute: true,
                            };
                            const regAuth = await this.getRegistryAuth(profile, action.image, options);
                            const typesFiles = globSync(`types/${skillName}/**/*.yaml`, globOpts);
                            await Promise.all(_.map(typesFiles, async (f) => {
                                const typeData = await readFile(f).catch(() => { });
                                if (typeData) {
                                    const type = parseObject(typeData.toString());
                                    let normalizedType = {};
                                    if (!('types' in type)) normalizedType.types = [type];
                                    else normalizedType = type;
                                    await this.catalogClient.saveType(project, profile.token, normalizedType);
                                    printSuccess(`Published type ${path.basename(f)}`, options);
                                }
                            }));
                            const modelsFiles = globSync(`models/${skillName}/**/*.yaml`, globOpts);
                            await Promise.all(_.map(modelsFiles, async (f) => {
                                const modelData = await readFile(f).catch(() => { });
                                if (modelData) {
                                    const model = parseObject(modelData.toString());
                                    await this.modelsClient.saveModel(project, profile.token, model);
                                    printSuccess(`Published model ${model.name}`, options);
                                }
                            }));
                            const experimentsFiles = globSync(`experiments/${skillName}/*/*.yaml`, globOpts);
                            await Promise.all(_.map(experimentsFiles, async (expFile) => {
                                const experimentData = await readFile(expFile).catch(() => { });
                                if (experimentData) {
                                    const experiment = parseObject(experimentData.toString());
                                    const result = await this.experimentClient.saveExperiment(project, profile.token, experiment).then((response) => response.success)
                                        .catch(() => false);
                                    if (result) {
                                        printSuccess(`Published experiment ${experiment.name}`, options);
                                        const runsFiles = globSync(`experiments/${skillName}/${experiment.name}/runs/**/*.yaml`, globOpts);
                                        await Promise.all(_.map(runsFiles, async (runFile) => {
                                            const runData = await readFile(runFile).catch(() => { });
                                            if (runData) {
                                                const run = parseObject(runData.toString());
                                                ///
                                                /// Note:  I would prefer to do an Update operation here instead, but the update endpoint
                                                ///        for experiment runs is currently broken.
                                                ///
                                                ///        In the interim, I just delete the run (if it exists) and then re-add it.
                                                ///
                                                await this.experimentClient.deleteRun(project, profile.token, experiment.name, run.runId);
                                                run.experimentName = experiment.name;
                                                await this.experimentClient.createRun(project, profile.token, run);
                                                printSuccess(`Published run ${run.runId}`, options);
                                                const artifacts = globSync(`experiments/${skillName}/${experiment.name}/runs/${run.runId}/artifacts/*`, globOpts);
                                                await Promise.all(_.map(artifacts, async (artifactUri) => {
                                                    const artifactName = path.basename(artifactUri).split('.')[0];
                                                    await this.experimentClient.uploadArtifact(project, profile.token, experiment.name, run.runId, artifactUri, artifactName);
                                                    printSuccess(`Published artifact ${artifactName}`, options);
                                                }));
                                            }
                                        }));
                                    } else {
                                        printError('Failed to save experiment', options);
                                    }
                                }
                            }));
                            const contentFiles = globSync(`content/${skillName}/*`, globOpts);
                            await Promise.all(_.map(contentFiles, async (f) => {
                                const key = `content/${skillName}/${path.posix.basename(f, path.posix.extname(f))}`;
                                await this.contentClient.uploadContentStreaming(project, profile.token, key, f);
                                printSuccess(`Published content ${key}`, options);
                            }));
                            // pass options if we want to skip docker push for example
                            await this.pushAction(action, tag, regAuth, options);
                        } else {
                            printError(`No image found for action ${action.name}.  Has it been built?`, options);
                            return false;
                        }
                        return true;
                    }));
                    if (_.every(actionsPublished)) {
                        const saveResult = await this.catalogClient.saveSkill(project, profile.token, info.skill);
                        if (saveResult.success) return true;
                        printError(`Skill save failed for ${info.skill.name}: ${saveResult.message}`, false);
                        return false;
                    }
                    printError('Publish Failed', options);
                    return false;
                }));
                return _.every(published);
            }
            console.log('No skills found');
            return false;
        } catch (err) {
            printError(err.message, options);
            printError('Publish Failed', options);
            return false;
        }
    }
}
