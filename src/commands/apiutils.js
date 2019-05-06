
const superagentRequest = require('superagent');
require('superagent-proxy')(superagentRequest);
const debug = require('debug')('cortex:cli');

const { printWarning } = require('./utils');

/**
 * makes a request via superagent. proxy methods will be utilized
 * if the user (i.e. person running cli commands) has set environment 
 * variables for their proxy (this is assuming ofc they have a proxy). if
 * no env variables set, the request just keeps piping through.
 */

function requestWrapper() {
    // @tutorial: https://stackoverflow.com/questions/22156326/private-properties-in-javascript-es6-classes
    // below are private variables
    const proxyEnv = process.env.https_proxy || process.env.http_proxy;
    const bothProxiesSet = process.env.https_proxy && process.env.http_proxy;
    const bothProxiesWarning = 'Both process.env.https_proxy AND process.env.http_proxy are set as env variables. Will default to process.env.https_proxy';

    const bypassProxy = process.env.bypass_proxy;

    this.get = function(endpoint) {
        if (bypassProxy) return superagentRequest.get(endpoint);

        bothProxiesSet && printWarning(bothProxiesWarning);
        return superagentRequest
            .get(endpoint)
            .proxy(proxyEnv);
    };
    this.delete = function(endpoint) {
        if (bypassProxy) return superagentRequest.delete(endpoint);

        bothProxiesSet && printWarning(bothProxiesWarning);
        return superagentRequest
            .delete(endpoint)
            .proxy(proxyEnv)
    };
    this.post = function(endpoint) {
        if (bypassProxy) return superagentRequest.post(endpoint);

        bothProxiesSet && printWarning(bothProxiesWarning);
        return superagentRequest
            .post(endpoint)
            .proxy(proxyEnv)
    }
    this.put = function(endpoint) {
        if (bypassProxy) return superagentRequest.put(endpoint);

        bothProxiesSet && printWarning(bothProxiesWarning);
        return superagentRequest
            .put(endpoint)
            .proxy(proxyEnv)
    }
}

module.exports.request = new requestWrapper();
