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
const {loadProfile} = require('../config');
const {printSuccess, printError} = require('./utils/baseutils');
const Actions = require('../client/actions');
const { callMe } = require('../commands/utils/baseutils');

module.exports.DockerLoginCommand = class {

    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDockerLogin()', profile.name);

        const action = new Actions(profile.url);
        const registryUrl = await action._cortexRegistryUrl(profile.token);
        try {
            await callMe(`docker login -u cli --password ${profile.token} ${registryUrl}`);
            printSuccess(JSON.stringify('Login Succeeded', null, 2), options);
        } catch (err) {
            printError(`Failed to docker login: ${err.message || err}`, options);
        }
    }
};