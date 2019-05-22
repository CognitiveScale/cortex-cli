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

const { request } = require('../commands/apiutils');
const Throttle = require('superagent-throttle');
const debug = require('debug')('cortex:cli');
const _ = require('lodash');
const chalk = require('chalk');
const { constructError } = require('../commands/utils');

const createEndpoints = (baseUri) => {
    return {
        profiles: `${baseUri}/v3/graph/profiles`,
        schemas: `${baseUri}/v3/graph/profiles/schemas`,
        events: `${baseUri}/v3/graph/events`,
        entities: `${baseUri}/v3/graph/entities`,
        track: `${baseUri}/v3/graph/events/track`,
        query: `${baseUri}/v3/graph/query`,
    }
};

const throttle = new Throttle({
    active: true,
    concurrent: 20,
    rate: 500,
    ratePer: 1000,
});

class Graph {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoints = createEndpoints(cortexUrl);
    }

    listProfiles(token, filter, sort, limit, skip) {
        debug('listProfiles() => GET %s', this.endpoints.profiles);
        const req = request
            .get(this.endpoints.profiles)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true);
        
        if (filter) req.query({ filter });
        if (sort) req.query({ sort });
        if (limit) req.query({ limit });
        if (skip) req.query({ skip });
        
        return req.then((res) => {
            if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                console.error(chalk.blue('Request proxied to cloud.'));
            if (res.ok) {
                return {success: true, profiles: res.body.profiles};
            }
            return {success: false, message: res.body, status: res.status};
        })
        .catch((err) => {
            return constructError(err);
        });
    }

    describeProfile(token, profileId, schemaName) {
        const endpoint = `${this.endpoints.profiles}/${profileId}`;
        debug('describeProfile(%s) => GET %s', profileId, endpoint);

        const req = request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true);

        if (schemaName) req.query({ schema: schemaName });

        return req.then((res) => {
            if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                console.error(chalk.blue('Request proxied to cloud.'));
            if (res.ok) {
                return {success: true, profile: res.body};
            }
            return {success: false, message: res.body, status: res.status};
        })
        .catch((err) => {
            return constructError(err);
        });
    }

    deleteProfile(token, profileId, schemaName) {
        const endpoint = `${this.endpoints.profiles}/${profileId}`;
        debug('deleteProfile(%s) => DELETE %s', profileId, endpoint);

        const req = request
            .delete(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true);

        if (schemaName) req.query({ schema: schemaName });

        return req.then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true,};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    findEvents(token, filter, sort, limit, skip) {
        debug('findEvents() => GET %s', this.endpoints.events);

        const req = request
            .get(this.endpoints.events)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true);

        if (filter) req.query({ filter });
        if (sort) req.query({ sort });

        if (limit) {
            req.query({ limit });
        }
        else {
            req.query({ limit: 50 });
        }

        if (skip) req.query({ skip });

        return req.then((res) => {
            if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                console.error(chalk.blue('Request proxied to cloud.'));
            if (res.ok) {
                return {success: true, events: res.body.events};
            }
            return {success: false, message: res.body, status: res.status};
        })
        .catch((err) => {
            return constructError(err);
        });
    }

    publishEntities(token, entityEvents) {
        debug('publishEntities() => POST %s', this.endpoints.events);

        return request
            .post(this.endpoints.events)
            .use(throttle.plugin())
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .type('json')
            .send(entityEvents)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));
                if (res.ok) {
                    return {success: true, message: res.body.message || res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    track(token, event) {
        debug('track() => POST %s', this.endpoints.track);

        return request
            .post(this.endpoints.track)
            .use(throttle.plugin())
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .type('json')
            .send(event)
            .then((res) => {
                if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));

                if (res.ok) {
                    return {success: true, message: res.body.message || res.body};
                }

                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                const e = constructError(err);
                debug(e);
                return e;
            });
    }

    rebuildProfiles(token, schemaName, profileId, filter, sort, limit, skip) {
        const endpoint = `${this.endpoints.schemas}/${schemaName}/rebuild`;
        debug('rebuildProfiles() => PUT %s', endpoint);

        const req = request
            .put(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true);

        req.query({ filter: filter ? filter : {} });

        if (profileId) req.query({ profileId });
        if (sort) req.query({ sort });
        if (limit) req.query({ limit });
        if (skip) req.query({ skip });

        return req.then((res) => {
            if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                console.error(chalk.blue('Request proxied to cloud.'));
            if (res.ok) {
                return {success: true, message: res.body.message || res.body};
            }
            return {success: false, message: res.body, status: res.status};
        })
        .catch((err) => {
            return constructError(err);
        });
    }

    getEntity(token, entityId) {
        const endpoint = `${this.endpoints.entities}/${entityId}`;
        debug('getEntity(%s) => GET %s', entityId, endpoint);

        const req = request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true);

        return req.then((res) => {
            if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                console.error(chalk.blue('Request proxied to cloud.'));
            if (res.ok) {
                return {success: true, entity: res.body};
            }
            return {success: false, message: res.body, status: res.status};
        })
        .catch((err) => {
            return constructError(err);
        });
    }

    query(token, query) {
        const endpoint = this.endpoints.query;
        debug('queryGraph(%s) => POST %s', query, endpoint);

        const req = request
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('x-cortex-proxy-notify', true)
            .send({ query })

        return req.then((res) => {
            if (Boolean(_.get(res, 'headers.x-cortex-proxied', false)))
                console.error(chalk.blue('Request proxied to cloud.'));
            if (res.ok) {
                return {success: true, result: res.body};
            }
            return {success: false, message: res.body, status: res.status};
        })
        .catch((err) => {
            return constructError(err);
        });
    }
}

module.exports = { Graph };
