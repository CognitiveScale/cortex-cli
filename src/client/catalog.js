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

const request = require('superagent');
const debug = require('debug')('cortex:cli');
const _ = require('lodash');
const chalk = require('chalk');
const { constructError } = require('../commands/utils');

const createEndpoints = (baseUri) => {
    return {
        catalog: `${baseUri}/v2/catalog`,
        skills: `${baseUri}/v3/catalog/skills`,
        agents: `${baseUri}/v3/catalog/agents`,
        types: `${baseUri}/v3/catalog/types`,
        agentVersions: `${baseUri}/v3/agents/versions`
    }
};

module.exports = class Catalog {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoints = createEndpoints(cortexUrl);
    }

    saveSkill(token, skillObj) {
        debug('saveSkill(%s) => %s', skillObj.name, this.endpoints.skills);
        return request
            .post(this.endpoints.skills)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send(skillObj)
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

    listSkills(token) {
        debug('listSkills() => %s', this.endpoints.skills);
        return request
            .get(this.endpoints.skills)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, skills: res.body.skills || res.body.processors};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeSkill(token, skillName) {
        const endpoint = `${this.endpoints.skills}/${skillName}`;
        debug('describeSkill(%s) => %s', skillName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
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

    listAgents(token) {
        debug('listAgents() => %s', this.endpoints.agents);
        return request
            .get(this.endpoints.agents)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, agents: res.body.agents};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    saveAgent(token, agentObj) {
        debug('saveAgent(%s) => %s', agentObj.name, this.endpoints.agents);
        return request
            .post(this.endpoints.agents)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send(agentObj)
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

    describeAgent(token, agentName) {
        const endpoint = `${this.endpoints.agents}/${agentName}`;
        debug('describeAgent(%s) => %s', agentName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
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

    describeAgentVersions(token, agentName) {
        const endpoint = `${this.endpoints.agentVersions}/${agentName}`;
        debug('describeAgentVersions(%s) => %s', agentName, endpoint);

        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
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

    saveType(token, types) {
        const names = types.types.map((t) => t.name);
        debug('saveType(%s) => %s', JSON.stringify(names), this.endpoints.types);
        return request
            .post(this.endpoints.types)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send(types)
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

    describeType(token, typeName) {
        const endpoint = `${this.endpoints.types}/${typeName}`;
        debug('describeType(%s) => %s', typeName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
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

    listTypes(token) {
        debug('listTypes() => %s', this.endpoints.types);
        return request
            .get(this.endpoints.types)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, types: res.body.types};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }
};
