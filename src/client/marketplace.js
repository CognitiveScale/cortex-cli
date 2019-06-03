/*
 * Copyright 2019 Cognitive Scale, Inc. All Rights Reserved.
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

const  { request } = require('../commands/apiutils');
const debug = require('debug')('cortex:cli');
const _ = require('lodash');
const chalk = require('chalk');
const { constructError } = require('../commands/utils');

module.exports = class Resource {

    constructor(baseUrl) {
        this.marketplaceUrl = `${baseUrl}/v3/marketplace`;
    }

    saveResource(resourceType, namespace, resourceName, token, resourceObject, zipFilePath) {
        const endpoint = `${this.marketplaceUrl}/admin/resource/${resourceType}/${namespace}/${resourceName}`;
        debug('saveResource(%s) => %s', resourceObject.asset.name, endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .accept('application/json')
            .field('meta', JSON.stringify(resourceObject))
            .attach('content', zipFilePath)
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

    listResourcesByType(resourceType, token, privateOnly, sort, offset, limit) {
        const endpoint = `${this.marketplaceUrl}/resource/${resourceType}?offset=${offset}&limit=${limit}&private=${privateOnly}&sort=${sort}`;
        debug('listResources() => %s', endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, resources: res.body.resources};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeResource(resourceType, namespace, resourceName, token) {
        const endpoint = `${this.marketplaceUrl}/resource/${resourceType}/${namespace}/${resourceName}`;
        debug('describeResource(%s) => %s', resourceName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, resource: res.body.resource};
                }
                else {
                    return {success: false, message: res.body.details, status: res.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    deleteResource(resourceType, namespace, resourceName, token) {
        const endpoint = `${this.marketplaceUrl}/resource/${resourceType}/${namespace}/${resourceName}`;
        debug('deleteResource(%s) => %s', resourceName, endpoint);
        return request
            .delete(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, status: res.body.status};
                }
                else {
                    return {success: false, message: res.body.message, status: res.body.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    searchResources(resourceType, searchObject, token, privateOnly, sort, offset, limit) {
        const endpoint = `${this.marketplaceUrl}/resource/search?offset=${offset}&limit=${limit}&private=${privateOnly}&sort=${sort}`;
        debug('searchResourcesByType(%s) => %s', resourceType, endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send(searchObject)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, resources: res.body.resources };
                }
                else {
                    return {success: false, message: res.body.message, status: res.body.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }


    installResource(resourceType, namespace, resourceName, token) {
        const endpoint = `${this.marketplaceUrl}/resource/${resourceType}/${namespace}/${resourceName}/install`;
        debug('installResource(%s) => %s', resourceName, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: res.body.success, scripts: res.body.response || res.body.scripts };
                }
                else {
                    return {success: false, message: res.body.message, status: res.body.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    executeResource(resourceType, namespace, resourceName, token, inputParams, route) {
        const endpoint = `${this.marketplaceUrl}/resource/${resourceType}/${namespace}/${resourceName}/execute`;
        const body = {
            inputParams: inputParams,
            route: route,
        }
        debug('executeResource(%s) => %s', resourceName, endpoint);
        return request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send(body)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, response: res.body };
                }
                else {
                    return {success: false, message: res.body.message, status: res.body.status};
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }

};