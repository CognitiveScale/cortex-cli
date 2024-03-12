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
// eslint-disable-next-line import/no-unresolved
import got from 'got';
import { got as gotAPIUtils, defaultHeaders } from './apiutils.js';
import { constructError, checkProject } from '../commands/utils.js';

const debug = debugSetup('cortex:cli');
export default (class Tasks {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}`;
    }

    listTasks(projectId, token, params) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks`;
        debug('listTasks(%s) => %s', projectId, endpoint);
        const opts = {
            headers: defaultHeaders(token),
        };
        if (params) {
            opts.searchParams = params;
        }
        return gotAPIUtils.get(endpoint, opts).json();
    }

    getTask(projectId, taskName, token, params) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks/${taskName}`;
        debug('getTask(%s, %s) => %s', projectId, taskName, endpoint);
        const opts = {
            headers: defaultHeaders(token),
        };
        if (params) {
            opts.searchParams = params;
        }
        return gotAPIUtils
            .get(endpoint, opts).json()
            .catch((err) => constructError(err));
    }

    taskLogs(projectId, token, taskName, follow = false, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks/${taskName}/logs`;
        debug('taskLogs(%s) => %s', taskName, endpoint);
        if (follow) {
            return got.stream(endpoint, {
              headers: defaultHeaders(token),
              searchParams: { follow, verbose },
            });
        // eslint-disable-next-line no-else-return
        } else {
            return gotAPIUtils
                .get(endpoint, {
                headers: defaultHeaders(token),
                searchParams: { follow, verbose },
            }).json()
                .then((res) => ({ ...res }))
                .catch((err) => constructError(err));
        }
    }

    deleteTask(projectId, token, taskName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks/${taskName}`;
        debug('deleteTask(%s) => %s', taskName, endpoint);
        return gotAPIUtils
            .delete(endpoint, {
            headers: defaultHeaders(token),
            searchParams: { verbose },
        }).json()
            .then((res) => ({ ...res }))
            .catch((err) => constructError(err));
    }

    pauseTask(projectId, token, taskName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks/${taskName}/pause`;
        debug('pauseTask(%s) => %s', taskName, endpoint);
        return gotAPIUtils
            .post(endpoint, {
            headers: defaultHeaders(token),
            searchParams: { verbose },
        }).json()
            .then((res) => ({ ...res }))
            .catch((err) => constructError(err));
    }

    resumeTask(projectId, token, taskName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks/${taskName}/resume`;
        debug('resumeTask(%s) => %s', taskName, endpoint);
        return gotAPIUtils
            .post(endpoint, {
            headers: defaultHeaders(token),
            searchParams: { verbose },
        }).json()
            .then((res) => ({ ...res }))
            .catch((err) => constructError(err));
    }
});
