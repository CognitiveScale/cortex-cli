/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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
const { loadProfile } = require('../config');
const Agents = require('../client/agents');
const { printSuccess, printError, filterObject, cleanInternalFields, jsonToYaml, writeToFile } = require('./utils');


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
 * Currently only exporting agent snapshots. This need to be updated for v6.
 *
 * @type {DeploySnapshotCommand}
 */
module.exports.DeploySnapshotCommand = class {
    constructor(program) {
        this.program = program;
    }

    execute(snapshotIds, options) {
        const exportPath = '.fabric/snapshots/';
        const manifestFile = 'fabric.yaml';

        const profile = loadProfile(options.profile);
        const envName = options.environmentName;
        debug('%s.exportDeploymentSnapshot(%s)', profile.name, snapshotIds);

        const agents = new Agents(profile.url);
        const promises = [];
        snapshotIds.split(' ').forEach(function (snapshotId) {
            promises.push(agents.describeAgentSnapshot(profile.token, snapshotId, envName).then((response) => {
                if (response.success) {
                        let result = filterObject(response.result, options);
                        result = cleanInternalFields(result);
                        let filename = snapshotId+".json";
                        if (options.yaml) {
                            result = jsonToYaml(result);
                            filename = snapshotId+".yaml";
                        }
                        const filepath = exportPath + filename;
                        writeToFile(result, filepath);
                        printSuccess(`Successfully exported agent snapshot ${filepath}`);
                        return filepath;
                } else {
                    printError(`Failed to export agent snapshot ${snapshotId}: ${response.message}`, options);
                }
            }).catch((err) => {
                    printError(`Failed to export agent snapshot ${snapshotId}: ${err.status} ${err.message}`, options);
            }));
        });

        Promise.all(promises).then(result => {
            const manifest = {
                "version": 1,
                "cortex": {
                    "snapshots": result
                }
            };
            writeToFile(jsonToYaml(manifest), manifestFile);
            printSuccess(`Successfully generated manifest file ${manifestFile}`);
        });
    }
};
