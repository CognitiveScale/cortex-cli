const request = require('superagent');
const debug = require('debug')('cortex:cli');

const createEndpoints = (baseUri) => {
    return {
        catalog: `${baseUri}/v2/catalog`,
        skills: `${baseUri}/v2/catalog/processors`,
        agents: `${baseUri}/v2/catalog/agents`,
        types: `${baseUri}/v2/catalog/types`,
    }
};

module.exports = class Catalog {

    constructor(cortexUrl) {
        this.cortexUrl = constructor;
        this.endpoints = createEndpoints(cortexUrl);
    }

    saveSkill(token, {name, title, description, properties, inputs, outputs}) {
        debug('saveSkill(%s) => %s', name, this.endpoints.skills);
        return request
            .post(this.endpoints.skills)
            .set('Authorization', `Bearer ${token}`)
            .send({name, title, description, properties, inputs, outputs})
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            });
    }

    listSkills(token) {
        debug('listSkill() => %s', this.endpoints.skills);
        return request
            .get(this.endpoints.skills)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, skills: res.body.skills || res.body.processors};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    describeSkill(token, skillName) {
        const endpoint = `${this.endpoints.skills}/${skillName}`;
        debug('describeSkill(%s) => %s', skillName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, skill: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            });
    }

    listAgents(token) {
        debug('listAgents() => %s', this.endpoints.agents);
        return request
            .get(this.endpoints.agents)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, agents: res.body.agents};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    saveAgent(token, {name, project, title, description, properties, inputs, outputs, processors}) {
        debug('saveAgent(%s) => %s', name, this.endpoints.agents);
        return request
            .post(this.endpoints.agents)
            .set('Authorization', `Bearer ${token}`)
            .send({name, project, title, description, properties, inputs, outputs, processors})
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            });
    }

    describeAgent(token, agentName) {
        const endpoint = `${this.endpoints.agents}/${agentName}`;
        debug('describeAgent(%s) => %s', agentName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, agent: res.body};
                }
                else {
                    return {success: false, message: res.body, status: res.status};
                }
            });
    }

    saveType(token, {name, title, description, fields}) {
        debug('saveType(%s) => %s', name, this.endpoints.types);
        return request
            .post(this.endpoints.types)
            .set('Authorization', `Bearer ${token}`)
            .send({name, title, description, fields});
    }
};
