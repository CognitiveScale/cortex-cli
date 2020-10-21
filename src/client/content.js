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
const got = require('got');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

const debug = require('debug')('cortex:cli');
const { constructError, getUserAgent } = require('../commands/utils');
const Variables = require('./variables');

module.exports = class Content {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = projectId => `${cortexUrl}/fabric/v4/projects/${projectId}/content`;
    }

    _sanitizeKey(key) {
        // strip leading slash, if any
        return key.replace(/^\//, '');
    }

    listContent(projectId, token) {
        const endpoint = this.endpoint(projectId);
        debug('listContent %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(message => ({ success: true, message }))
            .catch(err => constructError(err));
    }

    // eslint-disable-next-line no-unused-vars
    async uploadContentStreaming(projectId, token, key, content, showProgress = false, contentType = 'application/octet-stream') {
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projectId)}/${contentKey}`;
        // todo show progress..
        debug('uploadContentStreaming(%s, %s) => %s', key, content, endpoint);
        try {
            const message = await pipeline(
                fs.createReadStream(content),
                got.stream.post('https://sindresorhus.com', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': contentType,
                    },
                }),
            );
            return { success: true, message };
        } catch (err) {
            return constructError(err);
        }
    }

    async uploadSecureContent(projectId, token, key, content) {
        const contentKey = this._sanitizeKey(key);
        const vars = new Variables(this.cortextUrl);
        return vars.writeVariable(projectId, token, contentKey, content);
    }

    deleteContent(projectId, token, key) {
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projectId)}/${contentKey}`;
        debug('deleteContent => %s', endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                'user-agent': getUserAgent(),
            }).json()
            .then(message => ({ success: true, message }))
            .catch(err => constructError(err));
    }

    // TODO progress
    // eslint-disable-next-line no-unused-vars
    async downloadContent(projecId, token, key, showProgress = false) {
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projecId)}/${contentKey}`;
        debug('downloadContent(%s) => %s', key, this.endpoint);
        try {
            return pipeline(
                got.stream(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                    'user-agent': getUserAgent(),
                }),
                process.stdout,
            );
        } catch (err) {
            return constructError(err);
        }
    }

    async downloadSecureContent(projectId, token, key) {
        const contentKey = this._sanitizeKey(key);
        const vars = new Variables(this.cortextUrl);
        return vars.readVariable(projectId, token, contentKey);
    }
};
