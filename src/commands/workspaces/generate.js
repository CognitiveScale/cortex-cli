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
import { WorkspaceConfigureCommand } from './configure.js';
import { readConfig, loadProfile } from '../../config.js';
import { printToTerminal, validateToken } from './workspace-utils.js';
import {
 printSuccess, printError, validateName, generateNameFromTitle, 
} from '../utils.js';

const debug = debugSetup('cortex:cli');

const METADATA_FILENAME = 'metadata.json';

// ANSI escape sequences for pretty printing messages during generation.
// Reference: https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797#cursor-controls
const RESET_CURSOR_ANSI_ESCAPE = '\x1b[0G\x1b[2K';
const CURSOR_NEXT_LINE_ANSI_ESCAPE = '\x1b[1E';

/**
 * Class wrapping the raw results from fetching a Git Tree.
 *
 * (Primarily meant for type hinting).
 */
class GitTreeWrapper {
    constructor({
        // eslint-disable-next-line no-shadow
        path, mode, type, sha, size, url,
    }) {
        this.path = path;
        this.mode = mode;
        this.type = type;
        this.sha = sha;
        this.size = size;
        this.url = url;
        if (!this.path) {
            throw TypeError('Raw Git Tree is missing attribute "path"');
        }
        if (!this.type) {
            throw TypeError('Raw Git Tree is missing attribute "type"');
        }
    }
}

export class TemplateGenerationCommand {
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
        if (new.target === TemplateGenerationCommand) {
            throw new TypeError('Cannot construct TemplateGenerationCommand instances directly!');
        }
        if (typeof this.configureSubcommand !== 'function') {
            throw new TypeError('Cannot construct instance of TemplateGenerationCommand without overriding async method "configureSubcommand()"!');
        }
        if (typeof this.filterByFileName !== 'function') {
            throw new TypeError('Cannot construct instance of TemplateGenerationCommand without overriding async method "filterByFileName(string) -> bool"!');
        }
        // Set options controlling direct behavior
        this.program = program;
        this.resourceName = resourceName;
        this.resourceFolderName = resourceFolderName;
        this.resourceTemplateName = resourceTemplateName;
        this.configKey = configKey;
    }

    /**
     * Initializes the `BaseGenerateCommand` by setting execution-time options and retrieving the template
     * configuration from the config file.
     *
     * @param {string} name Desired name for the generated template
     * @param {string} destination Path to where the template should be generated
     * @param {option} options CLI runtime options
     */
    async init(name, destination, options) {
        this.options = options;
        this.name = name;
        this.destination = destination;
        this.config = readConfig();
        this.githubToken = await validateToken();
        this.authorization = this.githubToken;
        const templateConfig = this.getTemplateConfig();
        this.gitRepo = templateConfig.repo;
        this.branch = templateConfig.branch;
        debug('Initialized template configuration. Raw configuration: %s', JSON.stringify(templateConfig));
        debug('GitHub Token Set? %s', this.githubToken != null);
    }

    /**
     * Returns the configuration for the template repository/branch.
     *
     * @returns {object} The configuraiton for the template repository
     */
    getTemplateConfig() {
        return this.config.profiles[this.config.currentProfile][this.configKey];
    }
    
    /**
     * Queries GitHub to get the Git Tree(s) from a repository.
     *
     * @param {string} repo Github repository identifier (e.g. `org/repo`)
     * @param {string} sha Git SHA referencing the commit in the repository to retrieve
     * @returns {object} object returned by the GitHub API
     */
    fetchGitTree(repo, sha) {
        const uri = `repos/${repo}/git/trees/${sha}?recursive=true`;
        debug(`Querying Git Tree: ${uri}`);
        return ghGot(uri, {
            headers: { authorization: this.authorization },
        });
    }

    /**
     * Loads Git Tree(s) corresponding to the HEAD of configured repo/branch.
     *
     * @return {Array<GitTreeWrapper>} array of Git tree objects
     */
    async fetchGitTreeFromBranch() {
        const ghUri = `repos/${this.gitRepo}/branches/${this.branch || 'main'}`;
        debug('Loading templates from "%s" (branch = "%s"). URI: %s', this.gitRepo, this.branch, ghUri);
        const options = {
            headers: { authorization: this.authorization },
        };
        const tree = await ghGot(ghUri, options)
        .then((resp) => resp.body)
        .then((resp) => this.fetchGitTree(this.gitRepo, resp.commit.sha))
        .then((resp) => resp.body.tree)
        .then((resp) => resp.map((t) => new GitTreeWrapper(t)))
        .catch((e) => {
            debug('Error encountered while trying to fetch the git tree for the repository. %s', e);
            if (e?.response?.statusCode === 404) {
                printError('Unable to retrieve templates. Repository or branch not found!', this.options);
            }
        });
        return tree;
    }

    /**
     * Filters the Git Trees to only those that are blobs that match the glob pattern.
     *
     * @param {Array<GitTreeWrapper>} tree array of git tree objects
     * @param {string} glob pattern to match
     * @returns {Array<GitTreeWrapper>} instances matching the glob pattern
     */
    globTree(tree, glob) {
        debug('Checking for templates that include the glob pattern: %s', glob);
        const filterFunc = minimatch.filter(glob, { matchBase: true });
        const res = _.filter(tree, (f) => f.type === 'blob' && filterFunc(f.path));
        debug('Number of results matching glob pattern "%s": %s', glob, res.length);
        return res;
    }

    /**
     * Reads a file in the configured remote git repository.
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
     * @returns {object} object with user answers (`template`, `name`, `registry`)
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
     * @param {Array<GitTreeWrapper>} tree Git Trees for the contents of repository
     * @param {string | null | undefined} templateName Name of template
     * @returns {object} object with user selections (`template`, `name`, `registry`)
     */
    async selectTemplate(tree, templateName) {
        // Utils for proessing the Metadata file
        const loadMetadata = async (value) => {
            // TODO: this should have error handling to avoid a bad template crashing the CLI
            const data = JSON.parse((await this.readFile(value.path)).toString());
            debug('Successfully read metadata file: %s', value.path);
            return {
                name: data.title,
                value: { ...data, path: value.path },
            };
        };
        const filterByEnabled = (data) => data.value?.enabled;
        const filterByResourceType = (data) => (data.value?.resourceType) === this.resourceName;

        // Find possible choices for the template selection
        const registryUrl = await this.getRegistry();
        debug('Docker Registry URL: %s', registryUrl);
        const fileNames = this.globTree(tree, METADATA_FILENAME);
        const choices = (await Promise.all(_.map(fileNames, loadMetadata)))
            .filter(filterByEnabled)
            .filter(filterByResourceType);
        debug(JSON.stringify(choices));
        debug('Potential Choices: %s', JSON.stringify(choices.map((c) => c.name)));

        // Prompt user for selected template (handle template specified up front)
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
        // Fail if destination already exists
        if (fs.existsSync(path.join(destinationPath, this.resourceFolderName, name))) {
            printError(`${this.resourceName} ${name} already exists!`, this.options);
        }
    }

    /**
     * Applies templating over the filenames in the set of files to generate.
     *
     * @param {string} templateFolder Folder name for the template to be generated
     * @param {Array<object>} templateFiles Files that will be templated
     * @param {string} templateName String name to apply to the template
     * @returns {string} A string with all the filenames to generate separated by `<br>`
     */
    applyTemplatingToFilenames(templateFolder, templateFiles, templateName) {
        const generatedFiles = _.map(templateFiles, (f) => {
            try {
                const rootPathComponents = templateFolder.split('/');
                const destFile = _.drop(f.path.split('/'), rootPathComponents.length);
                const targetPath = path.join(...destFile);
                return _.template(targetPath, { interpolate: /__([\s\S]+?)__/g })({
                    [this.resourceTemplateName]: generateNameFromTitle(templateName),
                });
            } catch (err) {
                this.handleTemplatingError(templateName, f, err);
            }
            return undefined;
        }).join('<br>');
        return generatedFiles;
    }

    /**
     * Error handler for templating specific scenarios - exits the program.
     *
     * @param {string} templateName Name of the template being copied
     * @param {GitTreeWrapper} file File object that was being templated
     * @param {Error} err Error that was thrown
     */
    handleTemplatingError(templateName, file, err) {
        debug('Template Name: %s', templateName);
        debug('File details: %s', file);
        debug('Error details: %s', err);
        const message = `Failed to generate file "${file.path}" in template "${templateName}"!\n`
            + `This is possibly the result of the ${this.resourceName} template having an invalid syntax.\n`
            + `\nError: ${err.message}`;
        printError(message, this.options);
    }

    /**
     * Returns whether a given file (path) in the template should be excluded from the template.
     * Should return `true` if the file should be copied without modification.
     *
     * The default implementation allows for all files to be templated.
     *
     * @param {string} filepath
     * @returns {boolean} true if the file should NOT be templated, false otherwise
     */
    // eslint-disable-next-line no-unused-vars
    filterByFileName(filepath) {
        return false;
    }

    /**
     * Generates the selected template by templating its contents and writing its content to disk.
     * Returns the file tree with what files were created.
     *
     * @param {string} destinationPath path to generate template at
     * @param {string} generatedFiles String with all the filenames that will be created
     * @param {object} template Object with `template`, `name`, and `registry`
     * @param {Array<Object>} templateFiles Array of objects representing files to generate
     * @returns {object} An object containing the file tree for all generated files
     */
    async generateTemplatedFiles(destinationPath, generatedFiles, template, templateFiles) {
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
                    /// Try not to template any non-text files, and allow for a filter
                    if (isText(null, buf) && !this.filterByFileName(f.path)) {
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
                this.handleTemplatingError(template.name, f, err);
            }
        }));
        return treeObj;
    }

    /**
     * Generates the specified template at the given destination.
     *
     * @param {Array<GitTreeWrapper} tree Git Tree with contents of template
     * @param {object} template Object representing the template to generate
     * @param {string} destinationPath Path to create the template under
     * @returns {object} An object containing the file tree for all generated files
     */
    generateTemplate(tree, template, destinationPath) {
        // Find the set of files to template
        const templateFolder = path.posix.dirname(template.template.path);
        const templateFiles = this.globTree(tree, `${templateFolder}/**`);
        this.checkDestinationExists(destinationPath, template.name);
        const filesToGenerate = this.applyTemplatingToFilenames(templateFolder, templateFiles, template.name);
        return this.generateTemplatedFiles(destinationPath, filesToGenerate, template, templateFiles);
    }

    /**
     * Executes the template generation.
     *
     * @param {string} name Desired name for the generated template
     * @param {string} destination Path to where the template should be generated
     * @param {option} options CLI runtime options
     */
    async execute(name, destination, options) {
        await this.init(name, destination, options);
        const destinationPath = path.resolve(destination || process.cwd());
        if (!this.githubToken) {
            // Force registry configuration, if unset, and reload the config
            debug('Github Token not initialized for Profile "%s" in config section "%s" - beginning configuration step', this.config.currentProfile, this.configKey);
            printError(this.getTemplateConfig()
                ? 'Github authorization is invalid. Running configuration now.\n'
                : 'Generator is not configured. Running configuration now.\n', this.options, false);
            await this.configureSubcommand();
            await this.init(name, destination, options);
        }
        this.checkDestinationExists(destinationPath, name);
        printToTerminal(`${RESET_CURSOR_ANSI_ESCAPE}Loading templates...`);
        const tree = await this.fetchGitTreeFromBranch();
        printToTerminal(`${RESET_CURSOR_ANSI_ESCAPE}Templates loaded.${CURSOR_NEXT_LINE_ANSI_ESCAPE}`);
        if (tree.length) {
            const template = await this.selectTemplate(tree, options.template);
            if (template) {
                const treeObj = await this.generateTemplate(tree, template, destinationPath);
                printToTerminal('');
                if (!options || !boolean(options.notree)) {
                    printSuccess('Generated the following files:');
                    printToTerminal('');
                    printToTerminal(destinationPath);
                    printToTerminal(treeify.asTree(treeObj, true));
                }
                printSuccess('Generation complete.', this.options);
            }
        } else {
            printError('Unable to retrieve templates', this.options);
        }
    }
}


export class WorkspaceGenerateCommand extends TemplateGenerationCommand {
    constructor(program) {
        super(program, 'Skill', 'skills', 'skillname', 'templateConfig');
    }

    async configureSubcommand() {
        await (new WorkspaceConfigureCommand(this.program)).execute({ refresh: true });
    }
}
