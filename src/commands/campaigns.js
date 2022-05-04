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
 printSuccess, printError, filterObject, printTable, validateOptions, OPTIONSTABLEFORMAT, handleTable,
} = require('./utils');

module.exports.ListCampaignsCommand = class ListCampaignsCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListCampaigns()', profile.name);
        const { validOptions, errorDetails } = validateOptions(options, 'CAMPAIGN');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Campaign list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }
        const cli = new ApiServerClient(profile.url);
        try {
            const sortParam = (options.sort || '{}').replace(/"/g, '\'');
            const filterParam = (options.filter || '{}').replace(/"/g, '\'');
            const response = await cli.listCampaigns(options.project || profile.project, profile.token, filterParam, options.limit, options.skip, sortParam);
            let result = response;
            if (options.json) {
                if (options.query) result = filterObject(result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                const tableSpec = [
                    { column: 'Name', field: 'name', width: 30 },
                    { column: 'Title', field: 'title', width: 50 },
                    { column: 'Description', field: 'description', width: 80 },
                ];
                handleTable(tableSpec, result, null, 'No campaigns found');
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
        const options = cmd;
        const profile = await loadProfile(options.profile);
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

    async execute(campaignName, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeExportCampaignCommand(%s)', profile.name, campaignName);
        const cli = new Catalog(profile.url);
        const project = options.project || profile.project;
        const path = `./${options.o || `${campaignName}.amp`}`;
        try {
            await cli.exportCampaign(project, profile.token, campaignName, options.deployable, path);
            printSuccess(`Successfully exported Campaign ${campaignName} from project ${project} to file ${path}`);
        } catch (e) {
            printError(`Failed to export Campaign ${campaignName} from project ${project}. Error: ${e}`);
        }
    }
};

module.exports.ImportCampaignCommand = class ImportCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignFilepath, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeImportCampaignCommand(%s)', profile.name, campaignFilepath);
        const cli = new Catalog(profile.url);

        try {
            cli.importCampaign(options.project || profile.project, profile.token, campaignFilepath, options.deploy, options.overwrite);
        } catch (err) {
            printError(`Failed to import campaign: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.DeployCampaignCommand = class DeployCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignName, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeployCampaignCommand(%s)', profile.name, campaignName);
        const cli = new Catalog(profile.url);

        try {
            cli.deployCampaign(options.project || profile.project, profile.token, campaignName).then((response) => {
                if (response.success === false) throw response;
                const output = _.get(response, 'data.message') || JSON.stringify(response.data || response, null, 2);
                if (!response.data.warnings || response.data.warnings.length === 0) {
                    printSuccess(output, options);
                } else {
                    printError('Campaign deployed with warnings', options, false);
                    printTable([{ column: 'Warnings', field: 'message' }], response.data.warnings.map((w) => ({ message: w })));
                }
            }).catch((e) => {
                printError(`Failed to deploy campaign: ${e.status} ${e.message}`, options);
            });
        } catch (err) {
            printError(`Failed to deploy campaign: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.UndeployCampaignCommand = class UndeployCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignName, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeUndeployCampaignCommand(%s)', profile.name, campaignName);
        const cli = new Catalog(profile.url);

        try {
            cli.undeployCampaign(options.project || profile.project, profile.token, campaignName).then((response) => {
                if (response.success === false) throw response;
                const output = _.get(response, 'data.message') || JSON.stringify(response.data || response, null, 2);
                if (!response.data.warnings || response.data.warnings.length === 0) {
                    printSuccess(output, options);
                } else {
                    printError('Campaign undeployed with warnings', options, false);
                    printTable([{ column: 'Warnings', field: 'message' }], response.data.warnings.map((w) => ({ message: w })));
                }
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

    async execute(campaignName, missionName, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
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

    // eslint-disable-next-line consistent-return
    async execute(campaign, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);

        const { validOptions, errorDetails } = validateOptions(options, 'MISSION');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Mission list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }
        debug('%s.executeListMissionsCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);
        try {
            const sortParam = (options.sort || '{}').replace(/"/g, '\'');
            const filterParam = (options.filter || '{}').replace(/"/g, '\'');
            cli.listMissions(options.project || profile.project, profile.token, campaign, filterParam, options.limit, options.skip, sortParam).then((response) => {
                if (response.success === false) throw response;
                let data = Object.values(response.data);
                if (options.json) {
                    if (options.query) data = filterObject(data, options);
                    printSuccess(JSON.stringify(data, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Description', field: 'description', width: 80 },
                        { column: 'Status', field: 'lifecycleState', width: 30 },
                    ];
                    handleTable(tableSpec, data, null, 'No missions found');
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

    async execute(campaign, mission, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeployMissionCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);

        cli.deployMission(options.project || profile.project, profile.token, campaign, mission).then((response) => {
            if (response.success === false) throw response;
            const output = _.get(response, 'data.message') || JSON.stringify(response.data || response, null, 2);
            printSuccess(output, options);
        }).catch((err) => printError(`Failed to deploy mission ${mission} of campaign ${campaign}: ${err.status} ${err.message}`, options));
    }
};

module.exports.DescribeMissionCommand = class DescribeMissionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaign, mission, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeMissionCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);

        cli.getMission(options.project || profile.project, profile.token, campaign, mission).then((response) => {
            if (response.success === false) throw response;
            printSuccess(JSON.stringify(response.data, null, 2), options);
        }).catch((err) => printError(`Failed to describe mission ${mission} of campaign ${campaign}: ${err.status} ${err.message}`, options));
    }
};
