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
const URL = require('url-parse');
const { printSuccess, printError } = require('./utils');
const { callMe } = require('../commands/utils');
const {
    generateJwt,
    loadProfile,
} = require('../config');

module.exports.DockerLoginCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = loadProfile(options.profile);
        const ttl = options.ttl || '14d';

        try {
            // TODO fetch this from new endpoint or maybe store this in the profile??
            const registryUrl = (new URL(profile.url)).hostname.replace("api", "private-registry");
            const jwt = generateJwt(profile, ttl);
            const command = `docker login -u cli --password ${jwt} ${registryUrl}`;
            debug('%s.executeDockerLogin(%s)', profile.name, command);
            await callMe(command);
            printSuccess(JSON.stringify('Login Succeeded', null, 2), options);
        } catch (err) {
            printError(`Failed to docker login: ${err.message || err}`, options);
        }
    }
};
