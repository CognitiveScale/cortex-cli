import { globSync } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { v1 as uuid } from 'uuid';
import { Listr } from 'listr2';
import { parseObject, printSuccess, printError, handleError } from '../utils.js';
import { getSkillInfo, buildImageTag } from './workspace-utils.js';
import { loadProfile } from '../../config.js';
import Catalog from '../../client/catalog.js';
import Models from '../../client/models.js';
import Content from '../../client/content.js';
import Experiments from '../../client/experiments.js';
import ApiServerClient from '../../client/apiServerClient.js';
import getClient, { privateRegLogin } from '../../client/dockerClient.js';

export default class WorkspacePublishCommand {
    constructor(program) {
        this.program = program;
        // this.docker = getClient(program.opts());
    }

    async pushAction(action, imageTag, options) {
        const { skipPush, stdOutHandler } = options;
        /// -------------------------------------
        /// RETAGGING IMAGE SO CORTEX PICKS IT UP
        /// The K8s will not download new images unless the tag has changed ( unless ALWAYS PULL is specified)
        /// TODO use git hash instead...
        const buildId = uuid().substr(0, 6);
        const newTag = `${imageTag}:${buildId}`;
        const dockerCli = getClient(options);
        await dockerCli.tag(imageTag, newTag);
        /// -------------------------------------
        // Set image tag to new image tag for skill/action deployment later
        // eslint-disable-next-line no-param-reassign
        action.image = newTag;
        if (skipPush) {
            printSuccess(`Skipping docker push for: ${newTag}`);
            return true;
        }
        return dockerCli.push(newTag, stdOutHandler);
    }

    async execute(folder, options) {
        this.options = options;
        let target = process.cwd();
        const tasks = new Listr([], {});
        const globOpts = {
            cwd: target,
            absolute: true,
        };
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
            const project = options.project || profile.project;
            if (project) {
                const apiServer = new ApiServerClient(profile.url);
                try {
                    await apiServer.getProject(profile.token, project);
                } catch (err) {
                    handleError(err, options, `Project ${project} not found`);
                }
            } else {
                throw new Error('Project must be specified');
            }
            this.catalogClient = new Catalog(profile.url);
            this.modelsClient = new Models(profile.url);
            this.experimentClient = new Experiments(profile.url);
            this.contentClient = new Content(profile.url);
            try {
                if (options?.skipPush !== true) await privateRegLogin(options);
            } catch (err) {
                printError(err.message, options);
            }
            tasks.add(skillInfo.map((info) => {
                const skillName = info.skill.name;
                return {
                    title: `Publishing skill ${skillName}`,
                    task: (sCtx, sTask) => { // Per skill
                        const subTasks = [];
                        const actions = info.skill.actions ? info.skill.actions : [];
                        subTasks.push(actions.map((action) => ({
                            title: `Pushing docker images for ${action.name}`,
                            task: async (aCtx, aTask) => {
                                const tag = await buildImageTag(profile, action.image);
                                const imglist = await getClient(options).listImages(tag);
                                if (imglist.length !== 0) {
                                    try {
                                        await this.pushAction(action, tag, {
                                            ...options,
                                            stdOutHandler: (d) => aTask.output = d,
                                        });
                                        aTask.title = `Pushed docker image ${action.name}`;
                                    } catch (err) {
                                        throw Error(`Unable to push docker image: ${err.message}`);
                                    }
                                } else {
                                    throw Error(`No image found for action ${action.name}.  Has it been built?`);
                                }
                            },
                        })));
                        const typesFiles = globSync(`types/${skillName}/**/*.yaml`, globOpts);
                        subTasks.push(typesFiles.map((f) => ({
                            title: `Publishing type ${path.basename(f)}`,
                            task: async (tCtx, tTask) => {
                                const typeData = await readFile(f);
                                if (typeData) {
                                    const type = parseObject(typeData.toString());
                                    let normalizedType = {};
                                    if (!('types' in type)) {
                                        normalizedType.types = [type];
                                    } else {
                                        normalizedType = type;
                                    }
                                    await this.catalogClient.saveType(project, profile.token, normalizedType);
                                    tTask.title = `Published type ${path.basename(f)}`;
                                }
                            },
                        })));
                        const modelsFiles = globSync(`models/${skillName}/**/*.yaml`, globOpts);
                        subTasks.push(modelsFiles.map((f) => ({
                            title: `Publishing model ${path.basename(f)}`,
                            task: async (mCtx, mTask) => {
                                const modelData = await readFile(f);
                                if (modelData) {
                                    const model = parseObject(modelData.toString());
                                    await this.modelsClient.saveModel(project, profile.token, model);
                                    mTask.tile = `Published model ${model.name}`;
                                }
                            },
                        })));
                        const experimentsFiles = globSync(`experiments/${skillName}/*/*.yaml`, globOpts);
                        subTasks.push(experimentsFiles.map((expFile) => ({
                            title: `Publishing experiment ${path.basename(expFile)}`,
                            task: async (eCtx, eTask) => {
                                const experimentData = await readFile(expFile);
                                if (experimentData) {
                                    const experiment = parseObject(experimentData.toString());
                                    await this.experimentClient.saveExperiment(project, profile.token, experiment);
                                    eTask.title = `Published experiment ${experiment.name}`;
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
                                            eTask.title = `Published run ${run.runId}`;
                                            const artifacts = globSync(`experiments/${skillName}/${experiment.name}/runs/${run.runId}/artifacts/*`, globOpts);
                                            await Promise.all(artifacts.map(async (artifactUri) => {
                                                const artifactName = path.basename(artifactUri)
                                                    .split('.')[0];
                                                await this.experimentClient.uploadArtifact(project, profile.token, experiment.name, run.runId, artifactUri, artifactName);
                                                eTask.title = `Published artifact ${artifactName}`;
                                            }));
                                        }
                                    }));
                                } else {
                                    throw new Error('Failed to save experiment');
                                }
                            },
                        })));
                        const contentFiles = globSync(`content/${skillName}/*`, globOpts);
                        subTasks.push(contentFiles.map((f) => ({
                            title: `Uploading ${f} to managed content`,
                            task: async (mcCtx, mcTask) => {
                                const key = `content/${skillName}/${path.posix.basename(f, path.posix.extname(f))}`;
                                await this.contentClient.uploadContentStreaming(project, profile.token, key, f);
                                mcTask.tile = `Uploaded ${f}`;
                            },
                        })));
                        subTasks.push({
                            title: `Saving skill ${skillName}`,
                            task: async (dCtx, dTask) => {
                                // pass options if we want to skip docker push for example

                                await this.catalogClient.saveSkill(project, profile.token, info.skill);
                                dTask.title = `Skill ${info.skill.name} saved`;
                            },
                        });
                        return sTask.newListr(subTasks.flat(), { concurrent: false, rendererOptions: { collapseSubtasks: false } });
                },
            };
        }));
            try {
                await tasks.run();
            } catch (e) {
                printError('Publication Failed', options, false);
            }
        } else {
            printError('No skills found', options);
        }
    }
}
