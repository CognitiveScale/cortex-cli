/*
 * Copyright 2020 Cognitive Scale, Inc. All Rights Reserved.
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

const debug = require('debug')('cortex:cli');
const { got } = require('./apiutils');
const { constructError, getUserAgent, checkProject } = require('../commands/utils');

module.exports = class Tasks {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}`;
    }

    listTasks(projectId, token, params) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks`;
        debug('listTasks(%s) => %s', projectId, endpoint);
        const opts = {
            headers: { Authorization: `Bearer ${token}` },
            'user-agent': getUserAgent(),
        };
        if (params) {
            opts.searchParams = params;
        }
        return got
            .get(endpoint, opts).json()
            .catch((err) => constructError(err));
    }

    getTask(projectId, taskName, token, params) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks/${taskName}`;
        debug('getTask(%s, %s) => %s', projectId, taskName, endpoint);
        const opts = {
            headers: { Authorization: `Bearer ${token}` },
            'user-agent': getUserAgent(),
        };
        if (params) {
            opts.searchParams = params;
        }

        return got
            .get(endpoint, opts).json()
            .catch((err) => constructError(err));
    }

    taskLogs(projectId, token, taskName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks/${taskName}/logs`;
        debug('taskLogs(%s) => %s', taskName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { verbose },
            }).json()
            .then((res) => ({ ...res }))
            .catch((err) => constructError(err));
    }

    // todo delete/cancel Task
    deleteTask(projectId, token, taskName, verbose = false) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/tasks/${taskName}`;
        debug('deleteTask(%s) => %s', taskName, endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
                searchParams: { verbose },
            }).json()
            .then((res) => ({ ...res }))
            .catch((err) => constructError(err));
    }
};
