const request = require('superagent');
const debug = require('debug')('cortex:cli');

module.exports = class Auth {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
    }

    login(tenantId, username, password) {
        const endpoint = `${this.cortexUrl}/v2/admin/${tenantId}/users/authenticate`;
    
        debug('login(%s) => %s', username, endpoint);
    
        return request
            .post(endpoint)
            .send({
                username: username,
                password: password
            })
            .then((response) => {
                if (response.ok) {
                    debug('login response: %o', response.body);
                    return response.body.jwt;
                }
                else {
                    throw new Error('Authentication failed');
                }
            });
    }
};