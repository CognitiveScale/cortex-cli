const request = require('superagent');
require('superagent-proxy')(request);
const debug = require('debug')('cortex:cli');

/**
 * makes a request via superagent. proxy methods will be utilized
 * if the user (i.e. person running cli commands) has set environment 
 * variables for their proxy (this is assuming ofc they have a proxy). if
 * no env variables set, it just keeps piping through.
 * 
 * but, but: IF they set an env var for their proxy 
 *  > export http_proxy="http://10.255.255.30:3128"
 * but a proxy does NOT exist in the network, then the command will hang. Therefore,
 * they should ONLY ever set their proxy env variables when there actually exists
 * a proxy.
 */
module.exports.getRequest = function(uri) {
    return request
        .get(uri)
        .proxy(process.env.https_proxy)
        .proxy(process.env.http_proxy);
}

