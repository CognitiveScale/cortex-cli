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

const fs = require('fs');
const debug = require('debug')('cortex:cli');
const es = require('event-stream');
const yeoman = require('yeoman-environment');
const { loadProfile } = require('../config');
const Datasets = require('../client/datasets');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils/baseutils');

module.exports.ListDatasets = class ListDatasets {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listDatasets()', profile.name);

        const datasets = new Datasets(profile.url);
        datasets.listDatasets(profile.token).then((response) => {
            if (response.success) {
                let result = response.result;
                if (options.query) {
                    result = filterObject(response.result, options);
                }
                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Name', field: 'name', width: 40 },
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Connection Name', field: 'connectionName', width: 25 },
                        { column: 'Description', field: 'description', width: 50 },
                        { column: 'Created On', field: 'createdAt', width: 26 },
                        { column: 'Updated On', field: 'updatedAt', width: 26 },
                    ];

                    printTable(tableSpec, result.datasets);
                }
            }
            else {
                printError(`Failed to list datasets: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list datasets: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.SaveDatasetsCommand = class SaveDatasetsCommand {

    constructor(program) {
        this.program = program;
    }

   execute(datasetDefinition, options) {
       const profile = loadProfile(options.profile);
       debug('%s.executeSaveDatasetDefinition(%s)', profile.name, datasetDefinition);

       const connDefStr = fs.readFileSync(datasetDefinition);
       const connObj = parseObject(connDefStr, options);
       debug('%o', connObj);

       const datasets = new Datasets(profile.url);
       datasets.saveDatasets(profile.token, connObj).then((response) => {
           if (response.success) {
               printSuccess(`Dataset saved`, options);
           }
           else {
               printError(`Failed to save Dataset: ${response.status} ${response.message}`, options);
           }
       })
       .catch((err) => { // don't think we ever get here..
           printError(`Failed to save Datasets: ${err.status} ${err.message}`, options);
       });
   }
};

module.exports.DescribeDatasetCommand = class DescribeDatasetCommand {

    constructor(program) {
        this.program = program;
    }

    execute(datasetName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeDataset(%s)', profile.name, datasetName);

        const dataset = new Datasets(profile.url);
        dataset.describeDataset(profile.token, datasetName).then((response) => {
            if (response.success) {
                let result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe dataset ${datasetName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe dataset ${datasetName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.GetDataframeCommand = class GetDataframeCommand {

    constructor(program) {
        this.program = program;
    }

    execute(datasetName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeGetDataframe(%s)', profile.name, datasetName);

        const dataset = new Datasets(profile.url);
        dataset.getDataframe(profile.token, datasetName).then((response) => {
            if (response.success) {
                printSuccess(JSON.stringify(response.result, null, 2), options);
            }
            else {
                printError(`Failed to get dataframe ${datasetName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to get dataframe ${datasetName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.StreamDatasetCommand = class StreamDatasetCommand {

    constructor(program) {
        this.program = program;
    }

    execute(datasetName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeStreamDataset(%s)', profile.name, datasetName);

        const dataset = new Datasets(profile.url);
        dataset.streamDataset(profile.token, datasetName).then((response) => {
            if (response.success) {
                let stream = new es.Stream.PassThrough();
                stream.write(response.result.text);
                stream.end();
                stream.pipe(process.stdout)
            }
            else {
                printError(`Failed to stream dataset ${datasetName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to stream dataset ${datasetName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.GenerateDatasetCommand = class GenerateDatasetCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.generateDataset()', options.profile);
        const yenv = yeoman.createEnv();
        const profile = options.profile;
        yenv.lookup(()=>{
            yenv.run('@c12e/cortex:datasets',
                {'cortexProfile': profile },
                (err) => { err ? printError(err) : printSuccess('Done.') });
        });
    }
};
