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

const fs = require('fs');
const stream = require('stream');

const { promisify } = require('util');
const debug = require('debug')('cortex:cli');
const { got, defaultHeaders } = require('./apiutils');
const { createFileStream } = require('../commands/utils');
const { constructError, checkProject } = require('../commands/utils');

const pipeline = promisify(stream.pipeline);

module.exports = class Content {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/content`;
    }

    _sanitizeKey(key) {
        // strip leading slash, if any
        return key.replace(/^\//, '');
    }

    listContent(projectId, token, prefix) {
        checkProject(projectId);
        const endpoint = this.endpoint(projectId);
        debug('listContent() => %s', endpoint);
        const query = {};
        if (prefix) query.filter = prefix;
        return got
            .get(endpoint, {
                headers: defaultHeaders(token),
                searchParams: query,
            }).json()
            .then((message) => ({ success: true, message }))
            .catch((err) => constructError(err));
    }

    // eslint-disable-next-line no-unused-vars
    async uploadContentStreaming(projectId, token, key, content, showProgress = false, contentType = 'application/octet-stream') {
        checkProject(projectId);
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projectId)}/${contentKey}`;
        // todo show progress..
        debug('uploadContentStreaming(%s, %s) => %s', key, content, endpoint);
        try {
            const message = await pipeline(
                fs.createReadStream(content),
                got.stream.post(endpoint, {
                    headers: defaultHeaders(token, { 'Content-Type': contentType }),
                }),
                // https://github.com/sindresorhus/got/blob/HEAD/documentation/3-streams.md#stream-api
                // new stream.PassThrough() is required to catch errors.
                new stream.PassThrough(),
            );
            return { success: true, message };
        } catch (err) {
            return constructError(err);
        }
    }

    deleteContent(projectId, token, key) {
        checkProject(projectId);
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projectId)}/${contentKey}`;
        debug('deleteContent() => %s', endpoint);
        return got
            .delete(endpoint, {
                headers: defaultHeaders(token),
            }).json()
            .then((message) => ({ success: true, message }))
            .catch((err) => constructError(err));
    }

    // TODO progress
    // eslint-disable-next-line no-unused-vars
    downloadContent(projectId, token, key, showProgress = false, toFile = null) {
        checkProject(projectId);
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projectId)}/${contentKey}`;
        debug('downloadContent() => %s', endpoint);
        try {
            if (toFile) {
                toFile = createFileStream(toFile);
            } else {
                toFile = process.stdout;
            }
            return pipeline(
                got.stream(endpoint, { headers: defaultHeaders(token) }),
                toFile,
            );
        } catch (err) {
            return constructError(err);
        }
    }
};
