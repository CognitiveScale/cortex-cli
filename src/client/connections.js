/*
 * Copyright 2023 Cognitive Scale, Inc. All Rights Reserved.
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
import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { constructError, checkProject } from '../commands/utils.js';

const debug = debugSetup('cortex:cli');
export default (class Connections {
    constructor(cortexUrl) {
        this.endpoint = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/connections`;
        this.cortexUrl = cortexUrl;
    }

    listConnections(projectId, token, filter, limit, skip, sort) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}`;
        debug('listConnections() => %s', endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        }).json();
    }

    saveConnection(projectId, token, connObj) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}`;
        debug('saveConnection(%s) => %s', connObj.name, endpoint);
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: connObj,
        }).json();
    }

    describeConnection(projectId, token, connectionName) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(connectionName)}`;
        debug('describeConnection(%s) => %s', connectionName, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        }).json();
    }

    deleteConnection(projectId, token, connectionName) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(connectionName)}`;
        debug('deleteConnection(%s) => %s', connectionName, endpoint);
        return got
            .delete(endpoint, {
            headers: defaultHeaders(token),
        }).json();
    }

    listConnectionsTypes(token, limit, skip, sort) {
        const endpoint = `${this.cortexUrl}/fabric/v4/connectiontypes`;
        debug('listConnectionsTypes() => %s', endpoint);
        const query = {};
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        }).json()            
        .then((conns) => conns)
        .catch((err) => constructError(err));
    }
});
