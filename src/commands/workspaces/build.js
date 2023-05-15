import _ from 'lodash';
import fs from 'node:fs';
import path from 'node:path';
import { Listr } from 'listr2'
import { printError, printSuccess, printWarning } from '../utils.js';
import { getSkillInfo, buildImageTag } from './workspace-utils.js';
import { loadProfile } from '../../config.js';
import dockerCli from '../../client/dockerClient.js';

export default class WorkspaceBuildCommand {
    constructor(program) {
        this.program = program;
    }

    async buildAction(target, action, stdoutHandler, options) {
        const actionPath = path.join(target, 'actions', action.name);
        const expectedDockerfile = path.join(actionPath, 'Dockerfile');
        try {
            if (!fs.existsSync(expectedDockerfile)) {
                throw Error(`Unable to build action '${action.name}': Missing Dockerfile '${expectedDockerfile}', \nCheck that the 'actions/<name>' folder and action's name match or add a 'Dockerfile' in the path provided`);
            }
            const imageTag = await buildImageTag(this.profile, action.image);
            return dockerCli(options).build({
                 imageTag, contextPath: actionPath, dockerFile: expectedDockerfile, stdoutHandler,
            });
        } catch (err) {
            printError(`${expectedDockerfile}:\n\t ${err.message}`, options);
            return Promise.reject(err);
        }
    }

    async execute(folder, options) {
        this.options = options;
        let target = process.cwd();
        this.profile = await loadProfile(options.profile);
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
                const tasks = new Listr([], {
                });
                skillInfo.forEach((info) => {
                    const actions = info.skill.actions ? info.skill.actions : [];
                    actions.forEach((action) => {
                        tasks.add([
                            {
                                title: `Building skill "${info.skill.name}" action "${action.name}"`,
                                task: async (ctx, task) => {
                                    await this.buildAction(path.dirname(info.uri), action, (data) => task.output = data, options);
                                    task.title = `Successfully built skill "${info.skill.name}" action "${action.name}"`;
                                },
                        },
                    ]);
                    });
                });
                await tasks.run();
            } else {
                printSuccess('No skills found', options);
            }
        } catch (err) {
            printError(`Build Failed: ${err.message}`, options);
        }
    }
}
