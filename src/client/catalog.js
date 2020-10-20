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
const _ = require('lodash');
const chalk = require('chalk');
const got = require('got');
const  { request } = require('../commands/apiutils');
const { constructError, formatAllServiceInputParameters, checkProject } = require('../commands/utils');

const createEndpoints = (baseUri) => {
    return {
        skills: projectId => `${baseUri}/fabric/v4/projects/${projectId}/skills`,
        agents:  projectId => `${baseUri}/fabric/v4/projects/${projectId}/agents`,
        types:  projectId => `${baseUri}/fabric/v4/projects/${projectId}/types`,
    }
};

module.exports = class Catalog {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoints = createEndpoints(cortexUrl);
    }

    saveSkill(projectId,token, skillObj) {
        checkProject(projectId);
        debug('saveSkill(%s) => %s', skillObj.name, this.endpoints.skills);
        return got
            .post(this.endpoints.skills(projectId), {
                headers: { Authorization: `Bearer ${token}` },
                json: skillObj,
            })
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listSkills(projectId, token) {
        checkProject(projectId);
        debug('listSkills() => %s', this.endpoints.skills);
        return got
            .get(this.endpoints.skills(projectId), {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, skills: res.body.skills || res.body.processors};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeSkill(projectId, token, skillName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.skills(projectId)}/${skillName}`;
        debug('describeSkill(%s) => %s', skillName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, skill: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listAgents(projectId, token) {
        checkProject(projectId);
        const endpoint = this.endpoints.agents(projectId);
        debug('listAgents() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, agents: res.body.agents};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listServices(projectId, token, agentName, profile) {
        checkProject(projectId);
        debug('listServices() using describeAgent');
        return this.describeAgent(projectId, token, agentName).then((response) => {
            if (response.success) {
                const urlBase =  `${this.endpoints.agents(projectId)}/${agentName}/services`;
                const servicesList = response.agent.inputs
                    .filter(i => i.signalType === 'Service')
                    .map(i => ({ ...i, url: `${urlBase}/${i.name}` }))
                    .map(i => ({ ...i, formatted_types:
                    formatAllServiceInputParameters(i.parameters)}));
                return { success: true, services: servicesList };
            } else {
                return response;
            }
        });
    }

    saveAgent(projectId, token, agentObj) {
        checkProject(projectId);
        const endpoint = this.endpoints.agents(projectId);
        debug('saveAgent(%s) => %s', agentObj.name, endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                json: agentObj
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeAgent(projectId, token, agentName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${agentName}`;
        debug('describeAgent(%s) => %s', agentName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, agent: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeAgentVersions(projectId, token, agentName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.agents(projectId)}/${agentName}/versions`;
        debug('describeAgentVersions(%s) => %s', agentName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, agent: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    saveType(projectId, token, types) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}`;
        const names = types.types.map((t) => t.name);
        debug('saveType(%s) => %s', JSON.stringify(names), this.endpoints.types);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                json: types,
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeType(projectId, token, typeName) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}/${typeName}`;
        debug('describeType(%s) => %s', typeName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, type: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listTypes(projectId, token) {
        checkProject(projectId);
        const endpoint = `${this.endpoints.types(projectId)}`;
        debug('listTypes() => %s', this.endpoints.types);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.ok) {
                    return {success: true, types: res.body.types};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
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
