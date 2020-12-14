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
const _ = require('lodash');
const fs = require('fs');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const ApiServerClient = require('../client/apiServerClient');
const {
 printSuccess, printError, filterObject, parseObject, printTable, 
} = require('./utils');

module.exports.CreateMissionCommand = class CreateMissionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(missionDefinition, command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeSaveMission(%s)', profile.name, missionDefinition);
        let mission = {};
        try {
            if (missionDefinition) {
                const missionDefStr = fs.readFileSync(missionDefinition);
                mission = parseObject(missionDefStr, options);
            }
            if (_.isEmpty(options.name || mission.name)) {
                printError('`name` must be provided', options);
            }
            const cli = new ApiServerClient(profile.url);
            const response = await cli.createMission(options.project || profile.project, profile.token, mission);
            printSuccess(`Mission ${response.name} saved`, options);
        } catch (err) {
            printError(`Failed to save mission: ${err.message}`, options);
        }
    }
};

module.exports.ListMissionsCommand = class ListMissionsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListMissions()', profile.name);

        const cli = new ApiServerClient(profile.url);
        try {
        const response = await cli.listMissions(options.project || profile.project, profile.token);
            let result = response;
            if (options.query) result = filterObject(result, options);
            if (options.json) {
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                const tableSpec = [
                    { column: 'Name', field: 'name', width: 30 },
                    { column: 'Title', field: 'title', width: 50 },
                    { column: 'Description', field: 'description', width: 80 },
                ];
                printTable(tableSpec, result);
            }
        } catch (err) {
            printError(`Failed to list missions: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.DescribeMissionCommand = class DescribeMissionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(missionName, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeMission(%s)', profile.name, missionName);
        const cli = new ApiServerClient(profile.url);

        try {
                const response = await cli.getMission(options.project || profile.project, profile.token, missionName);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            printError(`Failed to describe mission: ${err.status} ${err.message}`, options);
        }
    }
};
