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
const { loadProfile } = require('../config');
const ApiServerClient = require('../client/apiServerClient');
const Catalog = require('../client/catalog');
const {
 printSuccess, printError, filterObject, printTable,
} = require('./utils');

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

module.exports.ExportCampaignCommand = class ExportCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    execute(campaignName, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeExportCampaignCommand(%s)', profile.name, campaignName);
        const cli = new Catalog(profile.url);

        try {
            cli.exportCampaign(options.project || profile.project, profile.token, campaignName, options.deployable, options.o);
        } catch (err) {
            printError(`Failed to export campaign: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.ImportCampaignCommand = class ImportCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    execute(campaignFilepath, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeImportCampaignCommand(%s)', profile.name, campaignFilepath);
        const cli = new Catalog(profile.url);

        try {
            cli.importCampaign(options.project || profile.project, profile.token, campaignFilepath, options.deploy, options.overwrite);
        } catch (err) {
            printError(`Failed to import campaign: ${err.status} ${err.message}`, options);
        }
    }
};
