/*
 * Copyright 2023 Cognitive Scale, Inc. All Rights Reserved.
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
import _ from 'lodash';
import debugSetup from 'debug';
import path from 'path';
import fs from 'fs';
// eslint-disable-next-line import/no-unresolved
import getStream from 'get-stream';
import * as yauzl from 'yauzl';
import yaml from 'js-yaml';
import { loadProfile } from '../config.js';
import Agents from '../client/agents.js';
import Catalog from '../client/catalog.js';
import Assessments from '../client/assessments.js';
import Connections from '../client/connections.js';
import Experiments from '../client/experiments.js';
import Models from '../client/models.js';
import Actions from '../client/actions.js';
import Content from '../client/content.js';
import {
    printSuccess, printError, cleanInternalFields, jsonToYaml, writeToFile, fileExists, deleteFile, filterObject,
} from './utils.js';

const debug = debugSetup('cortex:cli');

const artifactsDir = '.fabric';
const manifestFile = 'fabric.yaml';
const manifestMeta = {
    version: 1,
    kind: 'deployment-manifest',
    cortex: {},
};
function updateManifest(filepaths) {
    const manifest = fileExists(manifestFile) ? yaml.load(fs.readFileSync(manifestFile).toString()) : manifestMeta;
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
    if (dependencies.data) {
        const depsFilePath = path.join(artifactsDir, resourceName, '_dependencies.json');
        writeToFile(JSON.stringify(dependencies, null, 2), depsFilePath);
        const depsManifest = {};
        depsManifest[`_dependencies.${resourceType}.${resourceName}`] = [depsFilePath];
        updateManifest(depsManifest);
    } else {
        printError(`Failed to get dependencies of ${resourceName} of type ${resourceType} in project ${project}:  ${dependencies.status} ${dependencies.message}`);
    }
    return dependencies;
}
const DeployExperimentCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(experimentName, runId, options) {
        const profile = await loadProfile(options.profile);
        const project = options.project || profile.project;
        debug('%s.exportDeployExperimentCommand%s)', profile.name, experimentName);
        const manifest = {};
        const exports = {};
        const experiments = new Experiments(profile.url);
        const model = new Models(profile.url);
        const content = new Content(profile.url);
        let modelName;
        let response;
        response = await experiments.describeExperiment(project, profile.token, experimentName);
        if (response.success) {
            const result = filterObject(response.result, options);
            const expDesc = cleanInternalFields(result);
            const filepath = path.join(artifactsDir, 'experiments', `${experimentName}.json`);
            writeToFile(expDesc, filepath);
            manifest.experiment = [filepath];
            // TODO ???  module.exports ??? experimentName;
            modelName = result.modelId;
        } else {
            printError(`Failed to export experiment ${experimentName}: ${response.message}`, options);
        }
        // export model if provided in experiment
        if (modelName) {
            response = await model.describeModel(project, profile.token, modelName, true);
            if (response.success) {
                const result = filterObject(response.model, options);
                const modelDesc = cleanInternalFields(result);
                if (result.status && result.status === 'Published') {
                    const filepath = path.join(artifactsDir, 'models', `${modelName}.json`);
                    writeToFile(modelDesc, filepath);
                    manifest.model = [filepath];
                    // TODO ???  module.exports ??? modelName;
                } else {
                    printError(`Only Published models can be exported. Model ${modelName} is in ${result.status}`);
                }
            } else {
                printError(`Failed to export model ${modelName}: ${response.message}`, options);
            }
        }
        let exportRun = runId;
        if (!runId && options.latestRun) {
            response = await experiments.listRuns(project, profile.token, experimentName, null, 1, JSON.stringify({ startTime: -1 }));
            if (response.success) {
                const { runs } = response.result;
                if (_.size(runs)) {
                    exportRun = runs[0].runId;
                }
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
                // TODO ???  module.exports ??? exportRun;
            } else {
                printError(`Failed to export experiment ${experimentName}: ${response.message}`, options);
            }
        } else {
            printError('Provide runId or `--latestRun` option to export last run ', options);
        }
        updateManifest(manifest);
        printSuccess(`Successfully exported ${JSON.stringify(exports)} in ${artifactsDir} and updated manifest file ${manifestFile}`);
    }
};
const DeployConnectionCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(connectionName, options) {
        const profile = await loadProfile(options.profile);
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
export const DeploySnapshotCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(snapshotIds, options) {
        const profile = await loadProfile(options.profile);
        const project = options.project || profile.project;
        debug('%s.exportDeploymentSnapshot(%s)', profile.name, snapshotIds);
        const agents = new Agents(profile.url);
        const promises = [];
        snapshotIds.split(' ').forEach((snapshotId) => {
            promises.push(agents.describeAgentSnapshot(project, profile.token, snapshotId).then(async (response) => {
                let result = JSON.parse(response);
                // export dependant MLOps artifacts
                if (_.size(result.dependencies.connections)) {
                    await Promise.all(result.dependencies.connections.map(async (con) => {
                        if (_.size(con.connections)) {
                            await Promise.all(con.connections.map((c) => new DeployConnectionCommand(this.program).execute(c, options)));
                        }
                    }));
                }
                // export dependant MLOps artifacts
                if (_.size(result.dependencies.mlOps)) {
                    await Promise.all(result.dependencies.mlOps.map(async (ml) => {
                        if (_.size(ml.experiments)) {
                            await new DeployExperimentCommand(this.program).execute(ml.experiments[0], _.size(ml.runs) ? ml.runs[0] : null, options);
                        }
                    }));
                }
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
export const DeployCampaignCommand = class {
    constructor(program) {
        this.program = program;
    }

    processResource(project, campaign, stream, filename, entries) {
        return new Promise((resolve, reject) => {
            getStream.buffer(stream).then((content) => {
                let type;
                let filepath;
                if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
                    const resource = yaml.load(content.toString());
                    type = resource.kind;
                    filepath = path.join(artifactsDir, campaign, filename);
                    writeToFile(yaml.dump(resource), filepath);
                } else {
                    type = path.extname(filename).replace(/\./g, '');
                    filepath = path.join(artifactsDir, campaign, filename);
                    writeToFile(content, filepath);
                }
                const files = entries[type] || [];
                files.push(filepath);
                entries[type] = files;
                resolve(filepath);
            }).catch((e) => reject(e));
        });
    }

    async execute(campaignName, options) {
        const profile = await loadProfile(options.profile);
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
            zipfile.on('error', (e) => printError(e));
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
export const DeploySkillCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(skillName, options) {
        const profile = await loadProfile(options.profile);
        const project = options.project || profile.project;
        debug('%s.exportDeploySkillCommand%s)', profile.name, skillName);
        const manifest = {};
        const exports = {};
        const catalog = new Catalog(profile.url);
        catalog.describeSkill(project, profile.token, skillName, false).then(async (response) => {
            // check if response is valid skill and not error.
            if (response.success === false) {
                printError(`Failed to export skill ${skillName}: ${response.message}`, options);
            } else {
                const result = filterObject(response, options);
                const skillDesc = cleanInternalFields(result);
                const filepath = path.join(artifactsDir, 'skills', `${skillName}.json`);
                writeToFile(skillDesc, filepath);
                manifest.skill = [filepath];
                const dependencies = await addDependencies(profile.url, profile.token, project, 'Skill', skillName);
                // export linked connections of skill
                const connections = dependencies.data.filter((d) => d.type === 'Connection').map((d) => d.name);
                if (connections) {
                    await Promise.all(connections.map((connection) => new DeployConnectionCommand(this.program).execute(connection, options)));
                }
                // export linked model/experiment of skill
                const mlOps = Object.fromEntries(dependencies.data.filter((d) => ['Model', 'Experiment', 'ExperimentRun'].includes(d.type)).map((d) => [d.type, d.name]));
                if (mlOps && mlOps.Experiment) {
                    await new DeployExperimentCommand(this.program).execute(mlOps.Experiment, (mlOps.ExperimentRun || '').split('-').pop(), options);
                }
                // export actions of the skill
                const existingActions = result.actions.map((a) => a.name);
                const actions = dependencies.data.filter((d) => d.type === 'Action' && !existingActions.includes(d.name)).map((d) => d.name);
                if (actions.length > 0) {
                    const actionsClient = new Actions(profile.url);
                    await Promise.all(actions.map(async (a) => {
                        response = await actionsClient.describeAction(project, profile.token, a);
                        if (response.success) {
                            const actionDesc = cleanInternalFields(filterObject(response.action, options));
                            writeToFile(actionDesc, path.join(artifactsDir, 'actions', `${a}.json`));
                        } else {
                            printError(`Failed to export action ${a}: ${response.message}`, options);
                        }
                    }));
                    manifest.action = actions.map((a) => path.join(artifactsDir, 'actions', `${a}.json`));
                }
                // export types of skill
                const types = dependencies.data.filter((d) => d.type === 'Type').map((d) => d.name);
                if (types.length > 0) {
                    await Promise.all(types.map(async (type) => {
                        response = await catalog.describeType(project, profile.token, type);
                        if (response.success) {
                            const typeDesc = cleanInternalFields(filterObject(response.type, options));
                            writeToFile(typeDesc, path.join(artifactsDir, 'types', `${type}.json`));
                        } else {
                            printError(`Failed to export type ${type}: ${JSON.stringify(response)}`, options);
                        }
                    }));
                    manifest.type = types.map((a) => path.join(artifactsDir, 'types', `${a}.json`));
                }
                updateManifest(manifest);
                printSuccess(`Successfully exported  ${JSON.stringify(Object.assign(exports, mlOps))} in ${artifactsDir} and updated manifest file ${manifestFile}`);
            }
        }).catch((err) => {
            printError(`Failed to export skill ${skillName}: ${err.status} ${err.message}`, options);
        });
    }
};
export { DeployExperimentCommand as experiment };
export { DeployExperimentCommand as model };
export { DeployExperimentCommand as run };
export { DeployExperimentCommand };
export { DeployConnectionCommand };
