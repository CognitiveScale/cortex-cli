const request = require('superagent');
const debug = require('debug')('cortex:cli');

module.exports = class Agents {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV2 = `${cortexUrl}/v2/agents`;
        this.endpointV3 = `${cortexUrl}/v3/agents`;
    }

    invokeAgentService(token, agentName, serviceName, params) {
        const endpoint = `${this.endpointV3}/${agentName}/services/${serviceName}`;
        debug('invokeAgentService(%s, %s) => %s', agentName, serviceName, endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send(params)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }

    getServiceActivation(token, activationId) {
        const endpoint = `${this.endpointV3}/services/activations/${activationId}`;
        debug('getServiceActivation(%s) => %s', activationId, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            });
    }
}