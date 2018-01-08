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
            .send({name, title, description, properties, inputs, outputs});
    }

    saveAgent(token, {name, project, title, description, properties, inputs, outputs, processors}) {
        debug('saveAgent(%s) => %s', name, this.endpoints.agents);
        return request
            .post(this.endpoints.agents)
            .set('Authorization', `Bearer ${token}`)
            .send({name, project, title, description, properties, inputs, outputs, processors});
    }

    saveType(token, {name, title, description, fields}) {
        debug('saveType(%s) => %s', name, this.endpoints.types);
        return request
            .post(this.endpoints.types)
            .set('Authorization', `Bearer ${token}`)
            .send({name, title, description, fields});
    }
};
