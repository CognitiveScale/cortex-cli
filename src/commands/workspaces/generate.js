import fs from 'node:fs';
import path from 'path';
import URL from 'url-parse';
import { mkdir, writeFile } from 'fs/promises';
import minimatch from 'minimatch';
import inquirer from 'inquirer';
import ghGot from 'gh-got';
import { isText } from 'istextorbinary';
import treeify from 'treeify';
import { boolean } from 'boolean';
import _ from 'lodash';
import WorkspaceConfigureCommand from './configure.js';
import { readConfig, loadProfile } from '../../config.js';
import { printToTerminal, validateToken } from './workspace-utils.js';
import {
 printSuccess, printError, validateName, generateNameFromTitle, 
} from '../utils.js';

const METADATA_FILENAME = 'metadata.json';
export default class WorkspaceGenerateCommand {
    constructor(program) {
        this.program = program;
    }

    async loadTemplateTree({ repo, branch }) {
        printToTerminal('\x1b[0G\x1b[2KLoading templates...');
        this.gitRepo = repo;
        this.branch = branch;
        this.authorization = this.githubToken;
        this.tree = await ghGot(`repos/${repo}/branches/${branch || 'main'}`, {
            headers: { authorization: this.authorization },
        })
            .then((resp) => resp.body)
            .then((resp) => ghGot(`repos/${repo}/git/trees/${resp.commit.sha}?recursive=true`, {
            headers: { authorization: this.authorization },
        }))
            .then((resp) => resp.body.tree)
            .catch(() => []);
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
        const profile = await loadProfile(this.options.profile);
        const registryUrl = _.get(this, 'options.registry')
            || _.get(profile, `registries['${profile.currentRegistry}'].url`)
            || (new URL(profile.url)).hostname.replace('api', 'private-registry');
        return registryUrl;
    }

    async selectTemplate(templateName) {
        const registryUrl = await this.getRegistry();
        const fileNames = this.globTree(METADATA_FILENAME);
        const choices = await Promise.all(_.map(fileNames, async (value) => {
            const data = JSON.parse((await this.readFile(value.path)).toString());
            return {
                name: data.title,
                value: { ...data, path: value.path },
            };
        }));
        let template;
        if (templateName) {
            const templateChoice = _.find(choices, { name: templateName });
            if (templateChoice) {
                template = templateChoice.value;
            } else {
                printError(`Template ${templateName} not found!`);
            }
        }
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
            template,
        }).catch(() => { });
        return answers;
    }

    async execute(name, destination, options) {
        this.options = options;
        this.name = name;
        this.destination = destination;
        this.config = readConfig();
        this.githubToken = await validateToken();
        const destinationPath = path.resolve(destination || process.cwd());
        if (!this.githubToken) {
            printError(this.config.profiles[this.config.currentProfile].templateConfig
                ? 'Github authorization is invalid. Running configuration now.\n'
                : 'Workspace generator is not configured. Running configuration now.\n', this.options, false);
            await (new WorkspaceConfigureCommand(this.program)).execute({ refresh: true });
            this.config = readConfig();
        }
        if (name && fs.existsSync(path.join(destinationPath, 'skills', name))) {
            printError(`Skill ${name} already exists!`, this.options);
            return;
        }
        await this.loadTemplateTree(this.config.profiles[this.config.currentProfile].templateConfig);
        if (this.tree.length) {
            const template = await this.selectTemplate(options.template);
            if (template) {
                const templateFolder = path.posix.dirname(template.template.path);
                const templateFiles = this.globTree(`${templateFolder}/**`);
                const treeObj = {};
                if (fs.existsSync(path.join(destinationPath, 'skills', template.name))) {
                    printError(`Skill ${template.name} already exists!`, this.options);
                    return;
                }
                const generatedFiles = _.map(templateFiles, (f) => {
                    try {
                        const rootPathComponents = templateFolder.split('/');
                        const destFile = _.drop(f.path.split('/'), rootPathComponents.length);
                        const targetPath = path.join(...destFile);
                        return _.template(targetPath, { interpolate: /__([\s\S]+?)__/g })({
                            skillname: generateNameFromTitle(template.name),
                        });
                    } catch (err) {
                        printError(err.message, this.options);
                    }
                    return undefined;
                }).join('<br>');
                console.log('');
                await Promise.all(_.map(templateFiles, async (f) => {
                    try {
                        const fileName = path.posix.basename(f.path);
                        if (fileName !== METADATA_FILENAME) {
                            const templateVars = {
                                skillname: generateNameFromTitle(template.name),
                                generatedFiles,
                                template: template.template,
                            };
                            let buf = await this.readFile(f.path);
                            /// Try not to template any non-text files.
                            if (isText(null, buf)) {
                                buf = Buffer.from(_.template(buf.toString(), { interpolate: /{{([\s\S]+?)}}/g })(templateVars));
                            }
                            const relPath = f.path.slice(path.dirname(template.template.path).length);
                            const sourcePath = _.template(relPath, { interpolate: /__([\s\S]+?)__/g })(templateVars);
                            const targetPath = path.join(destinationPath, sourcePath);
                            await mkdir(path.dirname(targetPath), { recursive: true });
                            await writeFile(targetPath, buf);
                            _.set(treeObj, sourcePath.split('/'), null);
                        }
                    } catch (err) {
                        printError(err.message, this.options);
                    }
                }));
                if (!options || !boolean(options.notree)) {
                    printSuccess('Generated the following files:');
                    console.log('');
                    console.log(destinationPath);
                    console.log(treeify.asTree(treeObj, true));
                }
                printSuccess('Workspace generation complete.', this.options);
            }
        } else {
            printError('Unable to retrieve templates', this.options);
        }
    }
}
