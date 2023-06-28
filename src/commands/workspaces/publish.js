import { globSync } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { v1 as uuid } from 'uuid';
import inquirer from 'inquirer';
import _ from 'lodash';
import { Listr } from 'listr2';
import { parseObject, printSuccess, printError } from '../utils.js';
import { getSkillInfo, buildImageTag, getCurrentRegistry } from './workspace-utils.js';
import { loadProfile, generateJwt } from '../../config.js';
import Catalog from '../../client/catalog.js';
import Models from '../../client/models.js';
import Content from '../../client/content.js';
import Experiments from '../../client/experiments.js';
import ApiServerClient from '../../client/apiServerClient.js';
import getClient from '../../client/dockerClient.js';

export default class WorkspacePublishCommand {
    constructor(program) {
        this.program = program;
        // this.docker = getClient(program.opts());
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

    pushAction(action, imageTag, registryAuth, options) {
        const { skipPush } = options;
        /// -------------------------------------
        /// RETAGGING IMAGE SO CORTEX PICKS IT UP
        /// The cortex backend has a bug where the new image wont be used if the tag hasnt changed
        /// Remove this when this problem is fixed.
        const buildId = uuid().substr(0, 6);
        const newTag = `${imageTag}:${buildId}`;
        const dockerCli = getClient(options);
        dockerCli.tag(imageTag, newTag);
        /// -------------------------------------
        // Set image tag to new image tag for skill/action deployment later
        // eslint-disable-next-line no-param-reassign
        action.image = newTag;
        if (skipPush) {
            printSuccess(`Skipping docker push for: ${newTag}`);
            return true;
        }
        return dockerCli.push(newTag);
    }

    async execute(folder, options) {
        this.options = options;
        let target = process.cwd();
        const tasks = new Listr([], {
        });

//        try {
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

                tasks.add(skillInfo.map((info) => {
                    const skillName = info.skill.name;
                    return {
                        title: `Publishing ${skillName}`,
                        task: async (ctx, task) => {
                            const actions = info.skill.actions ? info.skill.actions : [];
                            const actionsPublished = await Promise.all(_.map(actions, async (action) => {
                                const tag = await buildImageTag(profile, action.image);
                                const imglist = await getClient(options).listImages(tag);
                                if (imglist.length !== 0) {
                                    const globOpts = {
                                        cwd: target,
                                        absolute: true,
                                    };
                                    const regAuth = await this.getRegistryAuth(profile, action.image, options);
                                    const typesFiles = globSync(`types/${skillName}/**/*.yaml`, globOpts);
                                    task.newListr(typesFiles.map((f) => ({
                                            title: `Publishing type ${path.basename(f)}`,
                                            task: async () => {
                                                const typeData = await readFile(f);
                                                if (typeData) {
                                                    const type = parseObject(typeData.toString());
                                                    let normalizedType = {};
                                                    if (!('types' in type)) normalizedType.types = [type];
                                                    else normalizedType = type;
                                                    await this.catalogClient.saveType(project, profile.token, normalizedType);
                                                    task.title = `Published type ${path.basename(f)}`;
                                                }
                                            },
                                        })));
                                    const modelsFiles = globSync(`models/${skillName}/**/*.yaml`, globOpts);
                                    task.newListr(modelsFiles.map((f) => ({
                                            title: `Publishing model ${path.basename(f)}`,
                                            task: async () => {
                                                const modelData = await readFile(f);
                                                if (modelData) {
                                                    const model = parseObject(modelData.toString());
                                                    await this.modelsClient.saveModel(project, profile.token, model);
                                                    task.tile = `Published model ${model.name}`;
                                                }
                                            },
                                        })));
                                    const experimentsFiles = globSync(`experiments/${skillName}/*/*.yaml`, globOpts);
                                    task.newListr(experimentsFiles.map((expFile) => ({
                                        title: `Publishing experiment ${path.basename(expFile)}`,
                                        task: async () => {
                                            const experimentData = await readFile(expFile);
                                            if (experimentData) {
                                                const experiment = parseObject(experimentData.toString());
                                                await this.experimentClient.saveExperiment(project, profile.token, experiment);
                                                task.title = `Published experiment ${experiment.name}`;
                                                const runsFiles = globSync(`experiments/${skillName}/${experiment.name}/runs/**/*.yaml`, globOpts);
                                                await Promise.all(runsFiles.map(async (runFile) => {
                                                    const runData = await readFile(runFile);
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
                                                        task.title = `Published run ${run.runId}`;
                                                        const artifacts = globSync(`experiments/${skillName}/${experiment.name}/runs/${run.runId}/artifacts/*`, globOpts);
                                                        await Promise.all(artifacts.map(async (artifactUri) => {
                                                            const artifactName = path.basename(artifactUri)
                                                                .split('.')[0];
                                                            await this.experimentClient.uploadArtifact(project, profile.token, experiment.name, run.runId, artifactUri, artifactName);
                                                            task.title = `Published artifact ${artifactName}`;
                                                        }));
                                                    }
                                                }));
                                            } else {
                                                throw new Error('Failed to save experiment');
                                            }
                                        },
                                    })));
                                    const contentFiles = globSync(`content/${skillName}/*`, globOpts);
                                    await Promise.all(contentFiles.map(async (f) => {
                                        const key = `content/${skillName}/${path.posix.basename(f, path.posix.extname(f))}`;
                                        await this.contentClient.uploadContentStreaming(project, profile.token, key, f);
                                        task.tile = `Published content ${key}`;
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
                                if (!saveResult.success) throw Error(`Skill save failed for ${info.skill.name}: ${saveResult.message}`, false);
                            }
                        },
                    };
                }));
                try {
                    await tasks.run();
                } catch (e) {
                    printError(e);
                }
            }
            printError('No skills found');
        // } catch (err) {
        //     printError(err.message, options);
        //     printError('Publish Failed', options);
        //     return false;
        // }
    }
}
