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

const _ = { get: require('lodash/get') };
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

module.exports.UndeployCampaignCommand = class UndeployCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    execute(campaignName, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeUndeployCampaignCommand(%s)', profile.name, campaignName);
        const cli = new Catalog(profile.url);

        try {
            cli.undeployCampaign(options.project || profile.project, profile.token, campaignName).then((response) => {
                if (response.success === false) throw response;
                const output = _.get(response, 'data.message') || JSON.stringify(response.data || response, null, 2);
                printSuccess(output, options);
            }).catch((e) => {
                printError(`Failed to undeploy campaign: ${e.status} ${e.message}`, options);
            });
        } catch (err) {
            printError(`Failed to undeploy campaign: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.UndeployMissionCommand = class UndeployMissionCommand {
    constructor(program) {
        this.program = program;
    }

    execute(campaignName, missionName, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeUndeployMissionCommand(%s)', profile.name, missionName);
        const cli = new Catalog(profile.url);

        try {
            cli.undeployMission(options.project || profile.project, profile.token, campaignName, missionName).then((response) => {
                if (response.success === false) throw response;
                const output = _.get(response, 'data.message') || JSON.stringify(response.data || response, null, 2);
                printSuccess(output, options);
            }).catch((e) => {
                printError(`Failed to undeploy mission: ${e.status} ${e.message}`, options);
            });
        } catch (err) {
            printError(`Failed to undeploy mission: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.ListMissionsCommand = class ListMissionsCommand {
    constructor(program) {
        this.program = program;
    }

    execute(campaign, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeListMissionsCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);

        try {
            cli.listMissions(options.project || profile.project, profile.token, campaign).then((response) => {
                if (response.success === false) throw response;
                const data = Object.values(response.data);
                if (options.json) {
                    printSuccess(JSON.stringify(data, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Description', field: 'description', width: 80 },
                        { column: 'Status', field: 'lifecycleState', width: 30 },
                    ];
                    printTable(tableSpec, data);
                }
            });
        } catch (err) {
            printError(`Failed to list missions of campaign ${campaign}: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.DeployMissionCommand = class DeployMissionCommand {
    constructor(program) {
        this.program = program;
    }

    execute(campaign, mission, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeDeployMissionCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);

        cli.deployMission(options.project || profile.project, profile.token, campaign, mission).then((response) => {
            if (response.success === false) throw response;
            const output = _.get(response, 'data.message') || JSON.stringify(response.data || response, null, 2);
            printSuccess(output, options);
        }).catch(err => printError(`Failed to deploy mission ${mission} of campaign ${campaign}: ${err.status} ${err.message}`, options));
    }
};

module.exports.DescribeMissionCommand = class DescribeMissionCommand {
    constructor(program) {
        this.program = program;
    }

    execute(campaign, mission, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeMissionCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);

        cli.getMission(options.project || profile.project, profile.token, campaign, mission).then((response) => {
            if (response.success === false) throw response;
            printSuccess(JSON.stringify(response.data, null, 2), options);
        }).catch(err => printError(`Failed to describe mission ${mission} of campaign ${campaign}: ${err.status} ${err.message}`, options));
    }
};
