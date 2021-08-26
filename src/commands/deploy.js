/*
 * Copyright 2020 Cognitive Scale, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const debug = require('debug')('cortex:cli');
const path = require('path');
const fs = require('fs');
const getStream = require('get-stream');
const yauzl = require('yauzl');
const yaml = require('js-yaml');
const { loadProfile } = require('../config');
const Agents = require('../client/agents');
const Catalog = require('../client/catalog');
const Assessments = require('../client/assessments');
const Connections = require('../client/connections');
const Experiments = require('../client/experiments');
const Models = require('../client/models');
const Actions = require('../client/actions');
const Content = require('../client/content');

const _ = {
    get: require('lodash/get'),
    set: require('lodash/set'),
    uniq: require('lodash/uniq'),
};
const {
 printSuccess, printError, cleanInternalFields, jsonToYaml, writeToFile, fileExists, deleteFile, filterObject,
} = require('./utils');

const artifactsDir = '.fabric';
const manifestFile = 'fabric.yaml';
const manifestMeta = {
    version: 1,
    kind: 'deployment-manifest',
    cortex: {},
};

function updateManifest(filepaths) {
    const manifest = fileExists(manifestFile) ? yaml.safeLoad(fs.readFileSync(manifestFile).toString()) : manifestMeta;
    Object.keys(filepaths).forEach((type) => {
        const kind = type.toLowerCase();
        const entries = [..._.get(manifest, `cortex.${kind}`, []), ...filepaths[type]];
        _.set(manifest, `cortex.${kind}`, _.uniq(entries));
    });
    writeToFile(jsonToYaml(manifest), manifestFile);
}

async function addDependencies(url, token, project, resourceType, resourceName) {
    const assessments = new Assessments(url);
    const dependencies = await assessments.getDependenciesOfResource(token, project, resourceType, resourceName);
    if (dependencies.success) {
        const depsFilePath = path.join(artifactsDir, resourceName, '_dependencies.json');
        writeToFile(JSON.stringify(dependencies), depsFilePath);
        const depsManifest = {};
        depsManifest[`_dependencies.${resourceType}.${resourceName}`] = [depsFilePath];
        updateManifest(depsManifest);
    } else {
        printError(`Failed to get dependencies of ${resourceName} of type ${resourceType} in project ${project}:  ${dependencies.status} ${dependencies.message}`);
    }
}

/**
 * Cortex deploy command is to export Cortex artifacts (agent, snapshot, skill, action etc) for CI/CD deployment. This command:
 * 1. Exports cortex artifacts
 * 2. generates manifest files to drive artifacts deployment
 * Files are exported/generated in pre-determined layout to support CI/CD deployment
 * .fabric
 *      snapshots
 *          snapshot1.yaml
 *          snapshot2.yaml
 *      agents
 *          ...
 *      skills
 *          ...
 *      actions
 *          ...
 * fabric.yaml (manifest file)
 *
 * Currently only exporting agent snapshots.
 *
 * @type {DeploySnapshotCommand}
 */
module.exports.DeploySnapshotCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(snapshotIds, options) {
        const profile = loadProfile(options.profile);
        const project = options.project || profile.project;
        debug('%s.exportDeploymentSnapshot(%s)', profile.name, snapshotIds);

        const agents = new Agents(profile.url);
        const promises = [];
        snapshotIds.split(' ').forEach((snapshotId) => {
            promises.push(agents.describeAgentSnapshot(project, profile.token, snapshotId).then((response) => {
                let result = JSON.parse(response);
                result = cleanInternalFields(result);
                let filename = `${snapshotId}.json`;
                if (options.yaml) {
                    result = jsonToYaml(result);
                    filename = `${snapshotId}.yaml`;
                }
                const filepath = path.join(artifactsDir, 'snapshots', filename);
                writeToFile(result, filepath);
                printSuccess(`Successfully exported agent snapshot ${filepath}`);
                return filepath;
            }).catch((err) => {
                printError(`Failed to export agent snapshot ${snapshotId}: ${err.status} ${err.message}`, options);
            }));
        });

        Promise.all(promises).then((result) => {
            updateManifest({ snapshots: result });
            printSuccess(`Successfully updated manifest file ${manifestFile}`);
        });
    }
};

module.exports.DeployCampaignCommand = class {
    constructor(program) {
        this.program = program;
    }

    processResource(project, campaign, stream, filename, entries) {
        return new Promise((resolve, reject) => {
            getStream.buffer(stream).then((content) => {
                let type;
                let filepath;
                if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
                    const resource = yaml.safeLoad(content);
                    type = resource.kind;
                    filepath = path.join(artifactsDir, campaign, filename);
                    writeToFile(yaml.safeDump(resource), filepath);
                } else {
                    type = path.extname(filename).replace(/\./g, '');
                    filepath = path.join(artifactsDir, campaign, filename);
                    writeToFile(content, filepath);
                }
                const files = entries[type] || [];
                files.push(filepath);
                entries[type] = files;
                resolve(filepath);
            }).catch(e => reject(e));
        });
    }

    async execute(campaignName, options) {
        const profile = loadProfile(options.profile);
        const project = options.project || profile.project;
        debug('%s.exportDeploymentCampaigns(%s)', profile.name, campaignName);

        const catalog = new Catalog(profile.url);
        await catalog.exportCampaign(project, profile.token, campaignName, options.deployable, `${campaignName}.zip`);
        const filepaths = {};
        const promises = [];

        yauzl.open(`${campaignName}.zip`, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                throw err;
            }
            zipfile.readEntry();
            zipfile.on('entry', (entry) => {
                zipfile.openReadStream(entry, (e, readStream) => {
                    if (e) {
                        printError(e);
                    }
                    promises.push(this.processResource(project, campaignName, readStream, entry.fileName, filepaths));
                    zipfile.readEntry();
                });
            });
            zipfile.on('error', e => printError(e));
            zipfile.once('end', async () => {
                await addDependencies(profile.url, profile.token, project, 'Campaign', campaignName);
                Promise.all(promises).then(() => {
                    updateManifest(filepaths);
                    printSuccess(`Successfully exported Campaign ${campaignName} in ${artifactsDir} and updated manifest file ${manifestFile}`);
                });
                deleteFile(`${campaignName}.zip`);
            });
        });
    }
};

module.exports.DeployConnectionCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(connectionName, options) {
        const profile = loadProfile(options.profile);
        const project = options.project || profile.project;
        debug('%s.exportDeploymentConnection%s)', profile.name, connectionName);

        const connection = new Connections(profile.url);
        connection.describeConnection(project, profile.token, connectionName).then(async (response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                const connectionDesc = cleanInternalFields(result);
                const filepath = path.join(artifactsDir, 'connections', `${connectionName}.json`);
                writeToFile(connectionDesc, filepath);
                updateManifest({ connection: [filepath] });
                await addDependencies(profile.url, profile.token, project, 'Connection', connectionName);
                printSuccess(`Successfully exported Connection ${connectionName} in ${artifactsDir} and updated manifest file ${manifestFile}`);
            } else {
                printError(`Failed to export connection ${connectionName}: ${response.message}`, options);
            }
        }).catch((err) => {
            printError(`Failed to export connection ${connectionName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DeploySkillCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(skillName, options) {
        const profile = loadProfile(options.profile);
        const project = options.project || profile.project;
        debug('%s.exportDeploySkillCommand%s)', profile.name, skillName);

        const catalog = new Catalog(profile.url);
        catalog.describeSkill(project, profile.token, skillName, false).then(async (response) => {
            if (response.success) {
                const result = filterObject(response.skill, options);
                const skillDesc = cleanInternalFields(result);
                const filepath = path.join(artifactsDir, 'skills', `${skillName}.json`);
                writeToFile(skillDesc, filepath);
                updateManifest({ skill: [filepath] });
                await addDependencies(profile.url, profile.token, project, 'Skill', skillName);
                printSuccess(`Successfully exported Skill ${skillName} in ${artifactsDir} and updated manifest file ${manifestFile}`);
            } else {
                printError(`Failed to export skill ${skillName}: ${response.message}`, options);
            }
        }).catch((err) => {
            printError(`Failed to export skill ${skillName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DeployExperimentCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(modelName, experimentName, runId, options) {
        const profile = loadProfile(options.profile);
        const project = options.project || profile.project;
        debug('%s.exportDeployExperimentCommand%s)', profile.name, experimentName);

        const manifest = {};
        const exports = {};
        const experiments = new Experiments(profile.url);
        const model = new Models(profile.url);
        const content = new Content(profile.url);

        let response;
        // export model if provided
        if (modelName) {
            response = await model.describeModel(project, profile.token, modelName, true);
            if (response.success) {
                const result = filterObject(response.model, options);
                const modelDesc = cleanInternalFields(result);
                const filepath = path.join(artifactsDir, 'models', `${modelName}.json`);
                writeToFile(modelDesc, filepath);
                manifest.model = [filepath];
                exports.model = modelName;
            } else {
                printError(`Failed to export model ${modelName}: ${response.message}`, options);
            }
        }
        response = await experiments.describeExperiment(project, profile.token, experimentName);
        if (response.success) {
            const result = filterObject(response.result, options);
            const expDesc = cleanInternalFields(result);
            const filepath = path.join(artifactsDir, 'experiments', `${experimentName}.json`);
            writeToFile(expDesc, filepath);
            manifest.experiment = [filepath];
            exports.experiment = experimentName;
        } else {
            printError(`Failed to export experiment ${experimentName}: ${response.message}`, options);
        }
        let exportRun = runId;
        if (!runId && options.latestRun) {
            response = await experiments.listRuns(project, profile.token, experimentName, null, 1, JSON.stringify({ startTime: -1 }));
            if (response.success) {
                exportRun = response.result.runs.pop().runId;
            }
        }
        if (exportRun) {
            response = await experiments.describeRun(project, profile.token, experimentName, exportRun);
            if (response.success) {
                const result = filterObject(response.result, options);
                const runDesc = cleanInternalFields(result);
                const filepath = path.join(artifactsDir, `experiments/${experimentName}/runs`, `${exportRun}.json`);
                writeToFile(runDesc, filepath);
                if (result.artifacts) {
                    await Promise.all(Object.values(result.artifacts)
                        .map((value) => content.downloadContent(project, profile.token, value, false, path.join(artifactsDir, value))));
                }
                manifest.run = [filepath];
                exports.run = exportRun;
            } else {
                printError(`Failed to export experiment ${experimentName}: ${response.message}`, options);
            }
        } else {
            printError('Provide runId or `--latestRun` option to export last run ', options);
        }
        printSuccess(`Successfully exported ${JSON.stringify(exports)} in ${artifactsDir} and updated manifest file ${manifestFile}`);
        updateManifest(manifest);
    }
};
