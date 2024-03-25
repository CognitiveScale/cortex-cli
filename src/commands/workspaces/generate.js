import fs from 'node:fs';
import path from 'path';
import URL from 'url-parse';
import { mkdir, writeFile } from 'fs/promises';
import { minimatch } from 'minimatch';
import inquirer from 'inquirer';
import ghGot from 'gh-got';
import debugSetup from 'debug';
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

const debug = debugSetup('cortex:cli');

const METADATA_FILENAME = 'metadata.json';

export class BaseGenerateCommand {
    /**
     * Creates a `BaseGenerateCommand`.
     *
     * @param {object} program Commander program object
     * @param {string} resourceName Name of the resource being generated (e.g. Skill, Pipeline, Foo, Bar)
     * @param {string} resourceFolderName Name of the folder in the repository that will be checked
     * @param {string} resourceTemplateName Expected folder name for the template - will be wrapped in underscores (e.g. __skillname__, __pipelinename__)
     * @param {string} configKey Key in Configuration to use for fetching the underlying Template Repository, Registry, etc.
     */
    constructor(program, resourceName, resourceFolderName, resourceTemplateName, configKey) {
        // Adhoc way of implemeting an abstract class that enforces a 'configureSubcommand()' method to be present
        if (new.target === BaseGenerateCommand) {
            throw new TypeError('Cannot construct BaseGenerateCommand instances directly!');
        }
        if (typeof this.configureSubcommand !== 'function') {
            throw new TypeError('Cannot construct instance of BaseGenerateCommand without overriding async method "configureSubcommand()"!');
        }
        this.program = program;
        this.resourceName = resourceName;
        this.resourceFolderName = resourceFolderName;
        this.resourceTemplateName = resourceTemplateName;
        this.configKey = configKey;
    }
    
    /**
     * Queries GitHub to get the Git Tree(s) in a repository.
     *
     * @param {string} repo Github repository identifier (e.g. `org/repo`)
     * @param {string} sha Git SHA referencing the commit in the repository to retrieve
     * @returns object
     */
    fetchGitTree(repo, sha) {
        const uri = `repos/${repo}/git/trees/${sha}?recursive=true`;
        debug(`Querying Git Tree: ${uri}`);
        return ghGot(uri, {
            headers: { authorization: this.authorization },
        });
    }

    /**
     * Loads Git Tree(s) corresponding to the HEAD of a specific branch in a git repository.
     *
     * @param {object} param0 Object with `repo` and `branch` keys
     * @return Array<Object> - array of Git tree objects
     */
    async fetchTemplateGitTrees({ repo, branch }) {
        // TODO: remove the assignments to 'this' to be outside of these methods
        this.gitRepo = repo;
        this.branch = branch;
        this.authorization = this.githubToken;
        const ghUri = `repos/${repo}/branches/${branch || 'main'}`;
        debug('Loading templates from "%s" (branch = "%s"). URI: %s', repo, branch, ghUri);
        const tree = await ghGot(ghUri, {
            headers: { authorization: this.authorization },
        })
        .then((resp) => resp.body)
        .then((resp) => this.fetchGitTree(repo, resp.commit.sha))
        .then((resp) => resp.body.tree)
        .catch(() => []);
        return tree;
    }

    /**
     * Filters the Git Trees to blobs that match the given glob pattern.
     *
     * @param {Array<object>} tree array of git tree objects
     * @param {string} glob pattern to match
     * @returns Array<object>
     */
    globTree(tree, glob) {
        debug('Checking for templates that include the glob pattern: %s', glob);
        const filterFunc = minimatch.filter(glob, { matchBase: true });
        return _.filter(tree, (f) => f.type === 'blob' && filterFunc(f.path));
    }

    /**
     * Reads a file path in the remote git repository.
     *
     * @param {string} filePath path to the file in the repository
     * @returns `Buffer` A Buffer with the contents of the file
     */
    async readFile(filePath) {
        const uri = `repos/${this.gitRepo}/contents/${filePath}?ref=${this.branch}`;
        debug('Reading file contents "%s" from git repository (uri = "%s")', filePath, uri);
        const response = await ghGot(uri, {
            headers: { authorization: this.authorization },
        });
        debug('Successfully read file contents "%s" from git repository', filePath);
        return Buffer.from(response.body.content, 'base64');
    }

    /**
     * Return a URL the Docker registry associated with the current Profile.
     *
     * @returns string
     */
    async getRegistry() {
        const profile = await loadProfile(this.options.profile);
        const registryUrl = _.get(this, 'options.registry')
            || _.get(profile, `registries['${profile.currentRegistry}'].url`)
            || (new URL(profile.url)).hostname.replace('api', 'private-registry');
        return registryUrl;
    }

    /**
     * Prompts the user to select the desired template.
     *
     * @param {string} registryUrl URL to Docker registry
     * @param {Array<string>} choices 
     * @param {string | null | undefined} template 
     * @returns object with user answers (`template`, `name`, `registry`)
     */
    async promptUser(registryUrl, choices, template) {
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
                message: `Enter a name for the ${this.resourceName}:`,
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

    /**
     * Selects the template to clone by fetching the potential choices from the given
     * Git Tree(s) and prompting the user for their desired template.
     *
     * @param {Array<object>} tree Git Tree(s) describing the repository
     * @param {string | null | undefined} templateName Name of template
     * @returns {object} object conatining 
     */
    async selectTemplate(tree, templateName) {
        const registryUrl = await this.getRegistry();
        debug('Docker Registry URL: %s', registryUrl);
        const fileNames = this.globTree(tree, METADATA_FILENAME);
        // debug('Files found matching glob pattern: %s', JSON.stringify(fileNames));
        const choices = await Promise.all(_.map(fileNames, async (value) => {
            const data = JSON.parse((await this.readFile(value.path)).toString());
            return {
                name: data.title,
                value: { ...data, path: value.path },
            };
        }));
        debug('Potential Choices: %s', JSON.stringify(choices));
        let template;
        if (templateName) {
            const templateChoice = _.find(choices, { name: templateName });
            if (templateChoice) {
                template = templateChoice.value;
            } else {
                printError(`Template ${templateName} not found!`);
            }
        }
        const answers = await this.promptUser(registryUrl, choices, template);
        return answers;
    }

    /**
     * Checks whether the path to where the Template will be generated already exists. If so, exists the program.
     *
     * @param {string} destinationPath Base directory
     * @param {string} name Name of the resource to be generated
     */
    checkDestinationExists(destinationPath, name) {
        // Check if destination already exists
        if (fs.existsSync(path.join(destinationPath, this.resourceFolderName, name))) {
            printError(`${this.resourceName} ${name} already exists!`, this.options);
        }
    }

    /**
     * ??
     *
     * @param {*} templateFolder 
     * @param {*} templateFiles 
     * @param {*} template 
     * @returns 
     */
    generateFiles(templateFolder, templateFiles, template) {
        const generatedFiles = _.map(templateFiles, (f) => {
            try {
                const rootPathComponents = templateFolder.split('/');
                const destFile = _.drop(f.path.split('/'), rootPathComponents.length);
                const targetPath = path.join(...destFile);
                return _.template(targetPath, { interpolate: /__([\s\S]+?)__/g })({
                    [this.resourceTemplateName]: generateNameFromTitle(template.name),
                });
            } catch (err) {
                printError(err.message, this.options);
            }
            return undefined;
        }).join('<br>');
        return generatedFiles;
    }

    /**
     * ????
     *
     * @param {*} destinationPath 
     * @param {*} generatedFiles 
     * @param {*} template 
     * @param {*} templateFiles 
     * @returns {object}
     */
    async computeFileTree(destinationPath, generatedFiles, template, templateFiles) {
        const treeObj = {};
        await Promise.all(_.map(templateFiles, async (f) => {
            try {
                const fileName = path.posix.basename(f.path);
                if (fileName !== METADATA_FILENAME) {
                    const templateVars = {
                        [this.resourceTemplateName]: generateNameFromTitle(template.name),
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
        return treeObj;
    }

    async execute(name, destination, options) {
        this.options = options;
        this.name = name;
        this.destination = destination;
        this.config = readConfig();
        this.githubToken = await validateToken();
        const destinationPath = path.resolve(destination || process.cwd());

        if (!this.githubToken) {
            debug('Github Token not initialized for Profile "%s" in config section "%s" - beginning configuration step', this.config.currentProfile, this.configKey);
            printError(this.config.profiles[this.config.currentProfile][this.configKey]
                ? 'Github authorization is invalid. Running configuration now.\n'
                : 'Workspace generator is not configured. Running configuration now.\n', this.options, false);
            await this.configureSubcommand();
            this.config = readConfig();
        }
        this.checkDestinationExists(destinationPath, name);

        const templateConfig = this.config.profiles[this.config.currentProfile][this.configKey];
        debug('Loading Templates - template configuration: %s', JSON.stringify(templateConfig));
        printToTerminal('\x1b[0G\x1b[2KLoading templates...');
        const tree = await this.fetchTemplateGitTrees(templateConfig);
        printToTerminal('\x1b[0G\x1b[2KTemplates loaded.\x1b[1E');
        if (tree.length) {
            const template = await this.selectTemplate(tree, options.template);
            if (template) {
                const templateFolder = path.posix.dirname(template.template.path);
                const templateFiles = this.globTree(tree, `${templateFolder}/**`);
                this.checkDestinationExists(destinationPath, template.name);
                const generatedFiles = this.generateFiles(templateFolder, templateFiles, template);
                console.log('');
                const treeObj = this.computeFileTree(destinationPath, generatedFiles, template, templateFiles);
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


export class WorkspaceGenerateCommand extends BaseGenerateCommand {
    constructor(program) {
        super(program, 'Skill', 'skills', 'skillname', 'templateConfig');
    }

    async configureSubcommand() {
        await (new WorkspaceConfigureCommand(this.program)).execute({ refresh: true });
    }
}
