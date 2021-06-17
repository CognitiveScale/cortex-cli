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
const FormData = require('form-data');
const http = require('https');
const fs = require('fs');
const { got } = require('./apiutils');
const {
 constructError, formatAllServiceInputParameters, checkProject, getUserAgent, printSuccess, printError,
} = require('../commands/utils');

const createEndpoints = baseUri => ({
        skills: projectId => `${baseUri}/fabric/v4/projects/${projectId}/skills`,
        agents: projectId => `${baseUri}/fabric/v4/projects/${projectId}/agents`,
        types: projectId => `${baseUri}/fabric/v4/projects/${projectId}/types`,
        campaigns: projectId => `${baseUri}/fabric/v4/projects/${projectId}/campaigns/`,
    });

module.exports = class Catalog {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoints = createEndpoints(cortexUrl);
    }

    saveSkill(projectId, token, skillObj) {
        checkProject(projectId);
        debug('saveSkill(%s) => %s', skillObj.name, this.endpoints.skills(projectId));
        return got
            .post(this.endpoints.skills(projectId), {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: skillObj,
            }).json()
            .then(res => ({ success: true, message: res }))
            .catch(err => constructError(err));
    }

    listSkills(projectId, token, status = false) {
        checkProject(projectId);
        debug('listSkills() => %s', this.endpoints.skills(projectId));
        const query = {};
        if (status) query.status = true;
        return got
            .get(this.endpoints.skills(projectId), {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: query,
            }).json()
            .then(skills => ({ success: true, ...skills }))
            .catch(err => constructError(err));
    }

    describeSkill(projectId, token, skillName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}`;
        debug('describeSkill(%s) => %s', skillName, endpoint);
        const searchParams = {};
        if (verbose) {
            searchParams.verbose = verbose;
            searchParams.status = verbose;
        }
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams,
            }).json()
            .then(res => ({ success: true, skill: res }))
            .catch(err => constructError(err));
    }

    deploySkill(projectId, token, skillName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}/deploy`;
        debug('deploySkill(%s) => %s', skillName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { verbose },
            }).json()
            .then(res => ({ ...res }))
            .catch(err => constructError(err));
    }

    unDeploySkill(projectId, token, skillName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}/undeploy`;
        debug('undeploySkill(%s) => %s', skillName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { verbose },
            }).json()
            .then(res => ({ ...res }))
            .catch(err => constructError(err));
    }

    skillLogs(projectId, token, skillName, actionName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${encodeURIComponent(skillName)}/action/${encodeURIComponent(actionName)}/logs`;
        debug('skillLogs(%s, %s) => %s', skillName, actionName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { verbose },
            }).json()
            .then(res => ({ ...res }))
            .catch(err => constructError(err));
    }

    listAgents(projectId, token) {
        checkProject(projectId);
        const endpoint = this.endpoints.agents(projectId);
        debug('listAgents() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(agentResp => ({ success: true, ...agentResp }))
            .catch(err => constructError(err));
    }

    listServices(projectId, token, agentName) {
        // TODO removed profile should I use that as the URL ??
        checkProject(projectId);
        debug('listServices() using describeAgent');
        return this.describeAgent(projectId, token, agentName).then((response) => {
            if (response.success) {
                const urlBase = `${this.endpoints.agents(projectId)}/${encodeURIComponent(agentName)}/services`;
                debug('listServices(%s) => %s', agentName, urlBase);
                const servicesList = response.agent.inputs
                    .filter(i => i.signalType === 'Service')
                    .map(i => ({ ...i, url: `${urlBase}/${i.name}` }))
                    .map(i => ({ ...i, formatted_types: formatAllServiceInputParameters(i.parameters) }));
                return { success: true, services: servicesList };
            }
                return response;
        });
    }

    saveAgent(projectId, token, agentObj) {
        checkProject(projectId);
        const endpoint = this.endpoints.agents(projectId);
        debug('saveAgent(%s) => %s', agentObj.name, endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: agentObj,
            }).json()
            .then(res => ({ success: true, message: res }))
            .catch(err => constructError(err));
    }

    describeAgent(projectId, token, agentName, verbose) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${encodeURIComponent(agentName)}`;
        debug('describeAgent(%s) => %s', agentName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { verbose },
            }).json()
            .then(agent => ({ success: true, agent }))
            .catch(err => constructError(err));
    }

    describeAgentVersions(projectId, token, agentName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${encodeURIComponent(agentName)}/versions`;
        debug('describeAgentVersions(%s) => %s', agentName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(agent => ({ success: true, agent }))
            .catch(err => constructError(err));
    }

    saveType(projectId, token, types) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}`;
        const names = types.types.map(t => t.name);
        debug('saveType(%s) => %s', JSON.stringify(names), this.endpoints.types(projectId));
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: types,
            })
            .json()
            .then(message => ({ success: true, message }))
            .catch(err => constructError(err));
    }

    describeType(projectId, token, typeName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}/${encodeURIComponent(typeName)}`;
        debug('describeType(%s) => %s', typeName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(type => ({ success: true, type }))
            .catch(err => constructError(err));
    }

    listTypes(projectId, token) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}`;
        debug('listTypes() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(types => ({ success: true, ...types }))
            .catch(err => constructError(err));
    }

    exportCampaign(projectId, token, campaignName, deployable, outputFileName) {
        checkProject(projectId);

        const url = `${this.endpoints.campaigns(projectId)}${campaignName}/export?deployable=${deployable}`;
        debug('exportCampaign(%s) => %s', campaignName, url);

        return http.get(url,
            { headers: { Authorization: `Bearer ${token}` } },
            (response) => {
            if (response.statusCode === 200 || response.statusCode === 201) {
                const path = `./${outputFileName || `${campaignName}.amp`}`;
                const file = fs.createWriteStream(path);
                response.pipe(file);
                printSuccess(`Successfully exported Campaign ${campaignName} from project ${projectId} to file ${path}`);
            } else {
                printError(`Failed to export Campaign ${campaignName} from project ${projectId}. Error: [${response.statusCode}] ${response.statusMessage}`);
            }
        }).on('error', (e) => {
            printError(e);
        });
    }

    importCampaign(projectId, token, filepath, deploy, overwrite) {
        checkProject(projectId);

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

        form.pipe(req)
            .on('response', (response) => {
                if (response.statusCode === 200 || response.statusCode === 201) {
                    printSuccess('Campaign imported successfully');
                } else {
                    printError(`Campaign file ${filepath} import failed with error: [${response.statusCode}] ${response.statusMessage}`);
                }
            }).on('error', (err) => {
                printError(err);
            });
    }

    listMissions(projectId, token, campaign) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.campaigns(projectId)}${campaign}/missions`;
        debug('listMissions() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => ({ success: true, data: res }))
            .catch(err => constructError(err));
    }

    deployMissions(projectId, token, campaign, mission) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.campaigns(projectId)}${campaign}/missions/${mission}/deploy`;
        debug('deployMissions() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            })
            .json()
            .then(res => ({ success: true, data: res }))
            .catch(err => constructError(err));
    }

    // saveProfileSchema(projectId, token, schemaObj) {
    //     debug('saveProfileSchema(%s) => %s', schemaObj.name, this.endpoints.profileSchemas);
    //     return request
    //         .post(this.endpoints.profileSchemas)
    //         .set('Authorization', `Bearer ${token}`)
    //         .set('x-cortex-proxy-notify', true)
    //         .send(schemaObj)
    //         .then((res) => {
    //             if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
    //                 console.error(chalk.blue('Request proxied to cloud.'));
    //             if (res.ok) {
    //                 return {success: true, message: res.body};
    //             }
    //             return {success: false, message: res.body, status: res.status};
    //         })
    //         .catch((err) => {
    //             return constructError(err);
    //         });
    // }
    //
    // listProfileSchemas(projectId, token, filter, sort, limit, skip) {
    //     debug('listProfileSchemas() => %s', this.endpoints.profileSchemas);
    //     const req = request
    //         .get(this.endpoints.profileSchemas)
    //         .set('Authorization', `Bearer ${token}`)
    //         .set('x-cortex-proxy-notify', true);
    //
    //     if (filter) req.query({ filter });
    //     if (sort) req.query({ sort });
    //     if (limit) req.query({ limit });
    //     if (skip) req.query({ skip });
    //
    //     return req.then((res) => {
    //         if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
    //             console.error(chalk.blue('Request proxied to cloud.'));
    //         if (res.ok) {
    //             return {success: true, schemas: res.body.schemas};
    //         }
    //         return {success: false, status: res.status, message: res.body};
    //     })
    //     .catch((err) => {
    //         return constructError(err);
    //     });
    // }
    //
    // describeProfileSchema(projectId, token, schemaName) {
    //     const endpoint = `${this.endpoints.profileSchemas}/${schemaName}`;
    //     debug('describeProfileSchema(%s) => %s', schemaName, endpoint);
    //     return request
    //         .get(endpoint)
    //         .set('Authorization', `Bearer ${token}`)
    //         .set('x-cortex-proxy-notify', true)
    //         .then((res) => {
    //             if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
    //                 console.error(chalk.blue('Request proxied to cloud.'));
    //             if (res.ok) {
    //                 return {success: true, schema: res.body};
    //             }
    //             else {
    //                 return {success: false, message: res.body, status: res.status};
    //             }
    //         })
    //         .catch((err) => {
    //             return constructError(err);
    //         });
    // }
    //
    // deleteProfileSchema(projectId, token, schemaName) {
    //     const endpoint = `${this.endpoints.profileSchemas}/${schemaName}`;
    //     debug('deleteProfileSchema(%s) => %s', schemaName, endpoint);
    //     return request
    //         .delete(endpoint)
    //         .set('Authorization', `Bearer ${token}`)
    //         .set('x-cortex-proxy-notify', true)
    //         .then((res) => {
    //             if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
    //                 console.error(chalk.blue('Request proxied to cloud.'));
    //             if (res.ok) {
    //                 return {success: true};
    //             }
    //             else {
    //                 return {success: false, message: res.body, status: res.status};
    //             }
    //         })
    //         .catch((err) => {
    //             return constructError(err);
    //         });
    // }
};
