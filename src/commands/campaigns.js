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
 printSuccess, printError, filterObject, parseObject, printTable, checkProject
} = require('./utils');

module.exports.CreateCampaignCommand = class CreateCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignDefinition, command) {
        const options = command.opts();
        const profile = loadProfile(options.profile);
        checkProject(options.project || profile.project);
        debug('%s.executeSaveCampaign(%s)', profile.name, campaignDefinition);
        let campaign = {};
        try {
            if (campaignDefinition) {
                const campaignDefStr = fs.readFileSync(campaignDefinition);
                campaign = parseObject(campaignDefStr, options);
            }
            const cli = new ApiServerClient(profile.url);
            const response = await cli.createCampaign(
                options.project || profile.project,
                profile.token,
                _.get(campaign, 'spec', campaign),
                );
            printSuccess(`Campaign ${response.name} saved`, options);
        } catch (err) {
            printError(`Failed to save campaign: ${err.message}`, options);
        }
    }
};

module.exports.ListCampaignsCommand = class ListCampaignsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListCampaigns()', profile.name);

        const cli = new ApiServerClient(profile.url);
        try {
        const response = await cli.listCampaigns(options.project || profile.project, profile.token);
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
            printError(`Failed to list campaigns: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.DescribeCampaignCommand = class DescribeCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignName, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeCampaign(%s)', profile.name, campaignName);
        const cli = new ApiServerClient(profile.url);

        try {
                const response = await cli.getCampaign(options.project || profile.project, profile.token, campaignName);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            printError(`Failed to describe campaign: ${err.status} ${err.message}`, options);
        }
    }
};
