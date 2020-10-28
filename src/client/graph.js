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

const debug = require('debug')('cortex:cli:graph');
const { got } = require('./apiutils');
const { constructError, getUserAgent } = require('../commands/utils');

const createEndpoints = baseUri => ({
    profileVersions: projectId => `${baseUri}/fabric/v4/projects/${projectId}/profile-versions`,
    profiles: projectId => `${baseUri}/fabric/v4/projects/${projectId}/profiles`,
    schemas: projectId => `${baseUri}/fabric/v4/projects/${projectId}/profiles/schemas`,
    events: projectId => `${baseUri}/fabric/v4/projects/${projectId}/events`,
    entities: projectId => `${baseUri}/fabric/v4/projects/${projectId}/entities`,
    track: projectId => `${baseUri}/fabric/v4/projects/${projectId}/events/track`,
    query: projectId => `${baseUri}/fabric/v4/projects/${projectId}/query`,
});

class Graph {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoints = createEndpoints(cortexUrl);
    }

    listProfiles(projectId, token, filter, sort, limit, skip) {
        debug('listProfiles() => GET %s', this.endpoints.profiles(projectId));
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.sort = skip;
        return got
            .get(this.endpoints.profiles(projectId), {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { query },
            }).json()
            .then(profiles => ({ success: true, profiles }))
            .catch(err => constructError(err));
    }

    listProfileVersions(projectId, token, profileId, schemaNames, before, after, limit) {
        const endpoint = `${this.endpoints.profileVersions}/${profileId}`;
        debug('listProfileVersions(%s) => GET %s', profileId, endpoint);
        const query = {};
        if (schemaNames) query.schemaNames = schemaNames;
        if (before) query.before = before;
        if (after) query.after = after;
        query.limit = 100;
        if (limit) query.limit = limit;

        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { query },
            }).json()
            .then(versions => ({ success: true, versions }))
            .catch(err => constructError(err));
    }

    describeProfile(projectId, token, profileId, schemaName, historic, versionLimit, attribute) {
        const endpoint = `${this.endpoints.profiles(projectId)}/${profileId}`;
        debug('describeProfile(%s) => GET %s', profileId, endpoint);
        const query = {};
        if (schemaName) query.schemaName = schemaName;
        if (historic) query.historic = historic;
        if (versionLimit) query.versionLimit = versionLimit;
        if (attribute) query.attribute = attribute;

        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { query },
            }).json()
            .then(profile => ({ success: true, profile }))
            .catch(err => constructError(err));
    }

    deleteProfile(projectId, token, profileId, schemaName) {
        const endpoint = `${this.endpoints.profiles(projectId)}/${profileId}`;
        debug('deleteProfile(%s) => DELETE %s', profileId, endpoint);
        const query = {};
        if (schemaName) query.schema = schemaName;
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { query },
            }).json()
            .then(() => ({ success: true }))
            .catch(err => constructError(err));
    }

    findEvents(projectId, token, filter, sort, limit, skip) {
        const endpoint = this.endpoints.events(projectId);
        debug('findEvents() => GET %s', endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (sort) query.sort = sort;
        // ?? if (versionLimit) query.versionLimit = versionLimit;
        if (skip) query.skip = skip;
        query.limit = 50;
        if (limit) query.limit = limit;

        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { query },
            }).json()
            .then(events => ({ success: true, events }))
            .catch(err => constructError(err));
    }

    publishEntities(projectId, token, entityEvents) {
        debug('publishEntities() => POST %s', this.endpoints.events(projectId));
        return got
            .post(this.endpoints.events(projectId), {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: entityEvents,
            }).json()
            .then(message => ({ success: true, message }))
            .catch(err => constructError(err));
    }

    track(projectId, token, event) {
        // TODO re-enable throttling
        const endpoint = this.endpoints.track(projectId);
        debug('track() => POST %s', endpoint);
        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: event,
            }).json()
            .then(message => ({ success: true, message }))
            .catch(err => constructError(err));
    }

    rebuildProfiles(projectId, token, schemaName, profileId, filter, sort, limit, skip) {
        const endpoint = `${this.endpoints.schemas}/${schemaName}/rebuild`;
        debug('rebuildProfiles() => PUT %s', endpoint);

        const query = {};
        query.filter = filter || {};

        if (profileId) query.profileId = profileId;
        if (sort) query.sort = sort;
        if (limit) query.limit = limit;
        if (skip) query.skip = skip;

        return got
            .put(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { query },
            }).json()
            .then(message => ({ success: true, message }))
            .catch(err => constructError(err));
    }

    getEntity(projectId, token, entityId) {
        const endpoint = `${this.endpoints.entities}/${entityId}`;
        debug('getEntity(%s) => GET %s', entityId, endpoint);

        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(entity => ({ success: true, entity }))
            .catch(err => constructError(err));
    }

    query(projectId, token, query) {
        const endpoint = this.endpoints.query;
        debug('queryGraph(%s) => POST %s', query, endpoint);

        return got
            .post(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                json: { query },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }
}

module.exports = { Graph };
