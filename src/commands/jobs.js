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
const { loadProfile } = require('../config');
const Jobs = require('../client/jobs');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

module.exports.ListJobs = class ListJobs {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listJobs()', profile.name);

        const jobs = new Jobs(profile.url);
        jobs.listJobs(profile.token).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    let result = filterObject(response.result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Name', field: 'name', width: 40 },
                        { column: 'Image', field: 'image', width: 90 },
                        { column: 'Memory', field: 'memory', width: 10 },
                        { column: 'Virtual CPUs', field: 'vcpus', width: 15 }
                    ];

                    printTable(tableSpec, response.result.jobs);
                }
            }
            else {
                printError(`Failed to list jobs: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list jobs: ${err.status} ${err.message}`, options);
        });
    }
};