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

import debugSetup from 'debug';
import FormData from 'form-data';
import http from 'https';
import fs from 'node:fs';
import { got, defaultHeaders } from './apiutils.js';
import {
 constructError, formatAllServiceInputParameters, checkProject, printSuccess, printError, printTable, 
} from '../commands/utils.js';

const debug = debugSetup('cortex:cli');
const createEndpoints = (baseUri) => ({
    skills: (projectId) => `${baseUri}/fabric/v4/projects/${projectId}/skills`,
    applications: (projectId) => `${baseUri}/fabric/v4/projects/${projectId}/applications`,
    skillStereotype: (projectId) => `${baseUri}/fabric/v4/projects/${projectId}/skillStereotypes`,
    agents: (projectId) => `${baseUri}/fabric/v4/projects/${projectId}/agents`,
    agentinvoke: (projectId) => `${baseUri}/fabric/v4/projects/${projectId}/agentinvoke`,
    types: (projectId) => `${baseUri}/fabric/v4/projects/${projectId}/types`,
    campaigns: (projectId) => `${baseUri}/fabric/v4/projects/${projectId}/campaigns/`,
});
export default class Catalog {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoints = createEndpoints(cortexUrl);
    }

    // Skill
    deleteSkill(projectId, token, skillName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}`;
        debug('deleteSkill(%s) => %s', skillName, endpoint);
        return got
            .delete(endpoint, {
                headers: defaultHeaders(token),
            })
            .json()
            .then((skill) => skill)
            .catch((err) => constructError(err));
    }

    saveSkill(projectId, token, skillObj) {
        checkProject(projectId);
        debug('saveSkill(%s) => %s', skillObj.name, this.endpoints.skills(projectId));
        return got
            .post(this.endpoints.skills(projectId), {
            headers: defaultHeaders(token),
            json: skillObj,
        }).json()
            .then((res) => ({ success: true, message: res }))
            .catch((err) => constructError(err));
    }

    listSkills(projectId, token, query, filter, limit, skip, sort) {
        checkProject(projectId);
        debug('listSkills() => %s', this.endpoints.skills(projectId));
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(this.endpoints.skills(projectId), {
            headers: defaultHeaders(token),
            searchParams: query,
        }).json();
    }

    describeSkill(projectId, token, skillName, verbose = false, output = 'json') {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}`;
        debug('describeSkill(%s) => %s', skillName, endpoint);
        const searchParams = { output };
        if (verbose) {
            searchParams.verbose = verbose;
            searchParams.status = verbose;
        }
        try {
            const res = got.get(endpoint, {
                headers: defaultHeaders(token),
                searchParams,
            });
            if (output.toLocaleLowerCase() === 'json') return res.json();
            return res.text();
        } catch (err) {
            return constructError(err);
        }
    }

    deploySkill(projectId, token, skillName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}/deploy`;
        debug('deploySkill(%s) => %s', skillName, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: { verbose },
        }).json();
    }

    unDeploySkill(projectId, token, skillName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}/undeploy`;
        debug('undeploySkill(%s) => %s', skillName, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: { verbose },
        }).json();
    }

    skillLogs(projectId, token, skillName, actionName, raw = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}/action/${encodeURIComponent(actionName)}/logs`;
        debug('skillLogs(%s, %s) => %s', skillName, actionName, endpoint);
        const gotOptions = {
            headers: defaultHeaders(token),
            searchParams: { raw },
        };
        return raw ? got.get(endpoint, gotOptions).text() : got.get(endpoint, gotOptions).json();
    }

    // Agent
    deleteAgent(projectId, token, agentName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${encodeURIComponent(agentName)}`;
        debug('deleteAgent(%s) => %s', agentName, endpoint);
        return got
            .delete(endpoint, {
                headers: defaultHeaders(token),
            })
            .json()
            .then((agent) => ({ success: true, agent }))
            .catch((err) => constructError(err));
    }

    listAgents(projectId, token, filter, limit, skip, sort) {
        checkProject(projectId);
        const endpoint = this.endpoints.agents(projectId);
        debug('listAgents() => %s', endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        })
            .json()
            .then((agentResp) => ({ success: true, ...agentResp }))
            .catch((err) => constructError(err));
    }

    async listServices(projectId, token, agentName) {
        // TODO removed profile should I use that as the URL ??
        checkProject(projectId);
        debug('listServices() using describeAgent');
        const agent = await this.describeAgent(projectId, token, agentName);
        const urlBase = `${this.endpoints.agentinvoke(projectId)}/${encodeURIComponent(agentName)}/services`;
        debug('listServices(%s) => %s', agentName, urlBase);
        const servicesList = agent.inputs
            .filter((i) => i.signalType === 'Service')
            .map((i) => ({ ...i, url: `${urlBase}/${i.name}` }))
            .map((i) => ({ ...i, formatted_types: formatAllServiceInputParameters(i.parameters) }));
        return servicesList;
    }

    saveAgent(projectId, token, agentObj) {
        checkProject(projectId);
        const endpoint = this.endpoints.agents(projectId);
        debug('saveAgent(%s) => %s', agentObj.name, endpoint);
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: agentObj,
        }).json()
            .then((res) => ({ success: true, message: res }))
            .catch((err) => constructError(err));
    }

    describeAgent(projectId, token, agentName, verbose = false, output = 'json') {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${encodeURIComponent(agentName)}`;
        debug('describeAgent(%s) => %s', agentName, endpoint);
        const res = got
            .get(endpoint, {
                headers: defaultHeaders(token),
                searchParams: { verbose, output },
            });
        if (output?.toLocaleLowerCase() === 'json') return res.json();
        return res.text();
    }

    async describeAgentVersions(projectId, token, agentName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${encodeURIComponent(agentName)}/versions`;
        debug('describeAgentVersions(%s) => %s', agentName, endpoint);
        try {
            const agent = await got
                .get(endpoint, {
                    headers: defaultHeaders(token),
                })
                .json();
            return ({
                success: true,
                agent,
            });
        } catch (err) {
            return constructError(err);
        }
    }

    deployAgent(projectId, token, agentName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${encodeURIComponent(agentName)}/deploy`;
        debug('deployAgent(%s) => %s', agentName, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: { verbose },
        }).json()
            .then((res) => ({ ...res }))
            .catch((err) => constructError(err));
    }

    unDeployAgent(projectId, token, agentName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${encodeURIComponent(agentName)}/undeploy`;
        debug('undeployAgent(%s) => %s', agentName, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: { verbose },
        }).json()
            .then((res) => ({ ...res }))
            .catch((err) => constructError(err));
    }

    // Type
    saveType(projectId, token, types) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}`;
        const names = types.types.map((t) => t.name);
        debug('saveType(%s) => %s', JSON.stringify(names), this.endpoints.types(projectId));
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: types,
        })
            .json()
            .then((message) => ({ success: true, message }))
            .catch((err) => constructError(err));
    }

    describeType(projectId, token, typeName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}/${encodeURIComponent(typeName)}`;
        debug('describeType(%s) => %s', typeName, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((type) => ({ success: true, type }))
            .catch((err) => constructError(err));
    }

    listTypes(projectId, token, limit, skip, sort) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}`;
        debug('listTypes() => %s', endpoint);
        const query = {};
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        })
            .json()
            .then((types) => ({ success: true, ...types }))
            .catch((err) => constructError(err));
    }

    deleteType(projectId, token, typeName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}/${encodeURIComponent(typeName)}`;
        debug('deleteType(%s) => %s', typeName, endpoint);
        return got
            .delete(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((type) => ({ success: true, type }))
            .catch((err) => constructError(err));
    }

    // Campaign
    exportCampaign(projectId, token, campaignName, deployable, path) {
        checkProject(projectId);
        const url = `${this.endpoints.campaigns(projectId)}${campaignName}/export?deployable=${deployable}`;
        debug('exportCampaign(%s) => %s', campaignName, url);
        return new Promise((resolve, reject) => {
            const download = got.stream(url, {
                headers: defaultHeaders(token),
            });
            download.on('error', (error) => reject(constructError(error).message));
            const fileOutput = fs.createWriteStream(path);
            fileOutput.on('error', (error) => reject(constructError(error).message));
            fileOutput.on('finish', resolve);
            download.pipe(fileOutput);
        });
    }

    importCampaign(projectId, token, filepath, deploy, overwrite) {
        checkProject(projectId);
        debug('importCampaign(%s)', this.endpoints.campaigns);
        const importUrl = `${this.endpoints.campaigns(projectId)}import?deployable=${deploy}&overwrite=${overwrite}`;
        debug('importCampaign(%s) => %s', filepath, importUrl);
        if (!fs.existsSync(filepath) || !fs.lstatSync(filepath).isFile()) {
            printError(`Campaign export file ${filepath} doesn't exists or not a valid export file`);
        }
        const readStream = fs.createReadStream(filepath);
        const form = new FormData();
        form.append('file', readStream);
        const headers = form.getHeaders();
        headers.Authorization = `Bearer ${token}`;
        const req = http.request(importUrl, {
            method: 'POST',
            headers,
        });
        form.pipe(req);
        req.on('response', (response) => {
            if (response.statusCode === 200 || response.statusCode === 201) {
                response.setEncoding('utf-8');
                response.on('data', (data) => {
                    const importReport = JSON.parse(data);
                    if (!importReport.warnings || importReport.warnings.length === 0) {
                        printSuccess('Campaign imported successfully');
                    } else {
                        printSuccess('Campaign imported with warnings');
                        printTable([{ column: 'Warnings', field: 'message' }], importReport.warnings.map((w) => ({ message: w })));
                    }
                });
            } else {
                printError(`Campaign file ${filepath} import failed with error: [${response.statusCode}] ${response.statusMessage}`);
            }
        }).on('error', (err) => {
            printError(err);
        });
    }

    undeployCampaign(projectId, token, campaign) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.campaigns(projectId)}${campaign}/undeploy`;
        debug('undeployCampaign() => %s', endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((res) => ({ success: true, data: res }))
            .catch((err) => constructError(err));
    }

    deployCampaign(projectId, token, campaign) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.campaigns(projectId)}${campaign}/deploy`;
        debug('deployCampaign() => %s', endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((res) => ({ success: true, data: res }))
            .catch((err) => constructError(err));
    }

    // Mission
    undeployMission(projectId, token, campaign, mission) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.campaigns(projectId)}${campaign}/missions/${mission}/undeploy`;
        debug('undeployMissions() => %s', endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((res) => ({ success: true, data: res }))
            .catch((err) => constructError(err));
    }

    listMissions(projectId, token, campaign, filter, limit, skip, sort) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.campaigns(projectId)}${campaign}/missions`;
        debug('listMissions() => %s', endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        })
            .json()
            .then((res) => ({ success: true, data: res }))
            .catch((err) => constructError(err));
    }

    deployMission(projectId, token, campaign, mission) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.campaigns(projectId)}${campaign}/missions/${mission}/deploy`;
        debug('deployMissions() => %s', endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((res) => ({ success: true, data: res }))
            .catch((err) => constructError(err));
    }

    getMission(projectId, token, campaign, mission) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.campaigns(projectId)}${campaign}/missions/${mission}`;
        debug('getMissions() => %s', endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((res) => ({ success: true, data: res }))
            .catch((err) => constructError(err));
    }

    // Application
    deleteApplication(projectId, token, name) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.applications(projectId)}/${encodeURIComponent(name)}`;
        debug('deleteApplication(%s) => %s', name, endpoint);
        return got
            .delete(endpoint, {
                headers: defaultHeaders(token),
            })
            .json();
    }

    saveApplication(projectId, token, appObj) {
        checkProject(projectId);
        debug('saveApplication(%s) => %s', appObj.name, this.endpoints.applications(projectId));
        return got
            .post(this.endpoints.applications(projectId), {
                headers: defaultHeaders(token),
                json: appObj,
            }).json()
            .then((res) => ({ success: true, message: res }))
            .catch((err) => constructError(err));
    }

    listApplications(projectId, token, query, filter, limit, skip, sort) {
        checkProject(projectId);
        debug('listApplications() => %s', this.endpoints.applications(projectId));
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(this.endpoints.applications(projectId), {
                headers: defaultHeaders(token),
                searchParams: query,
            }).json();
    }

    describeApplication(projectId, token, name, verbose = false, output = 'json') {
        checkProject(projectId);
        const endpoint = `${this.endpoints.applications(projectId)}/${encodeURIComponent(name)}`;
        debug('describeApplication(%s) => %s', name, endpoint);
        const searchParams = { output };
        if (verbose) {
            searchParams.verbose = verbose;
            searchParams.status = verbose;
        }
        try {
            const res = got.get(endpoint, {
                headers: defaultHeaders(token),
                searchParams,
            });
            if (['json', 'pretty'].includes(output.toLocaleLowerCase())) return res.json();
            return res.text();
        } catch (err) {
            return constructError(err);
        }
    }

    deployApplication(projectId, token, name) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.applications(projectId)}/${encodeURIComponent(name)}/deploy`;
        debug('deployApplication(%s) => %s', name, endpoint);
        try {
            return got
                .get(endpoint, {
                    headers: defaultHeaders(token),
                })
                .json();
        } catch (err) {
            return constructError(err);
        }
    }

    unDeployApplication(projectId, token, name) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.applications(projectId)}/${encodeURIComponent(name)}/undeploy`;
        debug('undeployApplication(%s) => %s', name, endpoint);
        return got
            .get(endpoint, {
                headers: defaultHeaders(token),
            }).json();
    }

    // Stereotype
    deleteStereotype(projectId, token, name) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skillStereotype(projectId)}/${encodeURIComponent(name)}`;
        debug('deleteStereotype(%s) => %s', name, endpoint);
        return got
            .delete(endpoint, {
                headers: defaultHeaders(token),
            })
            .json();
    }

    saveStereotype(projectId, token, appObj) {
        checkProject(projectId);
        debug('saveStereotype(%s) => %s', appObj.name, this.endpoints.skillStereotype(projectId));
        return got
            .post(this.endpoints.skillStereotype(projectId), {
                headers: defaultHeaders(token),
                json: appObj,
            }).json();
    }

    listStereotypes(projectId, token, query, filter, limit, skip, sort) {
        checkProject(projectId);
        debug('listStereotypes() => %s', this.endpoints.skillStereotype(projectId));
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(this.endpoints.skillStereotype(projectId), {
                headers: defaultHeaders(token),
                searchParams: query,
            }).json();
    }

    describeStereotype(projectId, token, name, verbose = false, output = 'json') {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skillStereotype(projectId)}/${encodeURIComponent(name)}`;
        debug('describeStereotype(%s) => %s', name, endpoint);
        const searchParams = { output };
        if (verbose) {
            searchParams.verbose = verbose;
            searchParams.status = verbose;
        }
        const res = got.get(endpoint, {
            headers: defaultHeaders(token),
            searchParams,
        });
        if (output.toLocaleLowerCase() === 'json') return res.json();
        return res.text();
    }
}
