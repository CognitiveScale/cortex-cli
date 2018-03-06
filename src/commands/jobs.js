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

module.exports.DescribeJob = class DescribeJob {

    constructor(program) {
        this.program = program;
    }

    execute(jobDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.describeJob()', profile.name);

        const jobs = new Jobs(profile.url);
        jobs.describeJob(profile.token, jobDefinition).then((response) => {
            if (response.success) {
                if (options.json) {
                    let result = response.result.job;
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Name', field: 'name', width: 40 },
                        { column: 'Image', field: 'image', width: 90 },
                        { column: 'Memory', field: 'memory', width: 10 },
                        { column: 'Virtual CPUs', field: 'vcpus', width: 15 }
                    ];
                    printTable(tableSpec, [response.result.job]);
                }
            }
            else {
                printError(`Failed to describe job: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to describe job: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.JobStatus = class JobStatus {

    constructor(program) {
        this.program = program;
    }

    execute(jobDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.jobStatus()', profile.name);

        const jobs = new Jobs(profile.url);
        jobs.jobStatus(profile.token, jobDefinition).then((response) => {
            if (response.success) {
                if (options.json) {
                    let result = response.result;
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Submitted', field: 'SUBMITTED', width: 15 },
                        { column: 'Pending', field: 'PENDING', width: 15 },
                        { column: 'Runnable', field: 'RUNNABLE', width: 15 },
                        { column: 'Starting', field: 'STARTING', width: 15 },
                        { column: 'Running', field: 'RUNNING', width: 15 },
                        { column: 'Succeeded', field: 'SUCCEEDED', width: 15 },
                        { column: 'Failed', field: 'FAILED', width: 15 }
                    ];
                    printTable(tableSpec, [response.result.stats]);
                }
            }
            else {
                printError(`Failed to describe job: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to describe job: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.SaveJob = class SaveJob {

    constructor(program) {
        this.program = program;
    }

    execute(jobDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.saveJob()', profile.name);

        const jobDefStr = fs.readFileSync(jobDefinition);
        const job = parseObject(jobDefStr, options);
        debug('%o', job);

        const jobs = new Jobs(profile.url);
        jobs.saveJob(profile.token, job).then((response) => {
            if (response.success) {
                printSuccess('Job saved', options);
            }
            else {
                printError(`Failed to save job: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to save job: ${err.status} ${err.message}`, options);
        });
    }
};