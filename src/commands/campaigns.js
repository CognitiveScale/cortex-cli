import debugSetup from 'debug';
import get from 'lodash/get.js';
import { loadProfile } from '../config.js';
import ApiServerClient from '../client/apiServerClient.js';
import Catalog from '../client/catalog.js';
import {
    printSuccess, printError, printTable, handleTable, printExtendedLogs, handleListFailure, getFilteredOutput, handleError,
} from './utils.js';
/*
 * Copyright 2023 Cognitive Scale, Inc. All Rights Reserved.
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
const debug = debugSetup('cortex:cli');
const _ = { get };
export class ListCampaignsCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListCampaigns()', profile.name);
        const cli = new ApiServerClient(profile.url);
        try {
            const sortParam = (options.sort || '{}').replace(/"/g, '\'');
            const filterParam = (options.filter || '{}').replace(/"/g, '\'');
            const result = await cli.listCampaigns(options.project || profile.project, profile.token, filterParam, options.limit, options.skip, sortParam);
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                printExtendedLogs(result, options);
                const tableSpec = [
                    { column: 'Name', field: 'name', width: 30 },
                    { column: 'Title', field: 'title', width: 50 },
                    { column: 'Description', field: 'description', width: 80 },
                ];
                handleTable(tableSpec, result, null, 'No campaigns found');
            }
        } catch (err) {
            handleListFailure(_.get(err, 'response.errors[0]', err), options, 'Campaigns');
        }
    }
}
export class DescribeCampaignCommand {
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
            getFilteredOutput(response, options);
        } catch (err) {
            printError(`Failed to describe campaign: ${err.status} ${err.message}`, options);
        }
    }
}
export class ExportCampaignCommand {
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
}
export class ImportCampaignCommand {
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
}
export class DeployCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignName, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeployCampaignCommand(%s)', profile.name, campaignName);
        const cli = new Catalog(profile.url);
        try {
            const response = await cli.deployCampaign(options.project || profile.project, profile.token, campaignName);
            const output = response?.message ?? JSON.stringify(response, null, 2);
            if (!response.warnings || response.warnings.length === 0) {
                printSuccess(output, options);
            } else {
                printError('Campaign deployed with warnings', options, false);
                printTable([{ column: 'Warnings', field: 'message' }], response.warnings.map((w) => ({ message: w })));
            }
        } catch (err) {
            handleError(err, options, 'Failed to deploy campaign');
        }
    }
}

export class UndeployCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignName, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeUndeployCampaignCommand(%s)', profile.name, campaignName);
        const cli = new Catalog(profile.url);
        try {
            const response = await cli.undeployCampaign(options.project || profile.project, profile.token, campaignName);
            const output = response?.message ?? JSON.stringify(response || response, null, 2);
            if (!response.warnings || response.warnings.length === 0) {
                printSuccess(output, options);
            } else {
                printError('Campaign undeployed with warnings', options, false);
                printTable([{ column: 'Warnings', field: 'message' }], response.warnings.map((w) => ({ message: w })));
            }
        } catch (err) {
            handleError(err, options, 'Failed to undeploy campaign');
        }
    }
}
export class UndeployMissionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignName, missionName, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeUndeployMissionCommand(%s)', profile.name, missionName);
        const cli = new Catalog(profile.url);
        try {
            const response = await cli.undeployMission(options.project || profile.project, profile.token, campaignName, missionName);
            const output = response?.message ?? JSON.stringify(response, null, 2);
            printSuccess(output, options);
        } catch (err) {
            handleError(err, options, 'Failed to undeploy mission');
        }
    }
}
export class ListMissionsCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(campaign, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeListMissionsCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);
        try {
            const sortParam = (options.sort || '{}').replace(/"/g, '\'');
            const filterParam = (options.filter || '{}').replace(/"/g, '\'');
            const response = await cli.listMissions(options.project || profile.project, profile.token, campaign, filterParam, options.limit, options.skip, sortParam);
                const data = Object.values(response);
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(data, options);
                } else {
                    printExtendedLogs(data, options);
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Description', field: 'description', width: 80 },
                        { column: 'Status', field: 'lifecycleState', width: 30 },
                    ];
                    handleTable(tableSpec, data, null, 'No missions found');
                }
        } catch (err) {
            handleListFailure(_.get(err, 'response.errors[0]', err), options, 'Missions');
        }
    }
}
export class DeployMissionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaign, mission, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeployMissionCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);
        try {
            const response = await cli.deployMission(options.project || profile.project, profile.token, campaign, mission);
            const output = response?.message ?? JSON.stringify(response, null, 2);
            printSuccess(output, options);
        } catch (err) {
            printError(`Failed to deploy mission ${mission} of campaign ${campaign}: ${err.status} ${err.message}`, options);
        }
    }
}
export class DescribeMissionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaign, mission, cmd) {
        const options = cmd;
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeMissionCommand(%s)', profile.name, campaign);
        const cli = new Catalog(profile.url);
        try {
            const response = await cli.getMission(options.project || profile.project, profile.token, campaign, mission);
            printSuccess(JSON.stringify(response, null, 2), options);
        } catch (err) {
            printError(`Failed to describe mission ${mission} of campaign ${campaign}: ${err.status} ${err.message}`, options);
        }
    }
}
