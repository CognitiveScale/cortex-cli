/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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
const os = require('os');
const path = require('path');
const { URL } = require('url');

const ProgressBar = require('progress');
const  { request } = require('../commands/apiutils');
const debug = require('debug')('cortex:cli');
const { constructError } = require('../commands/utils');
const { getUserAgent } = require('../useragent');

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
        debug('listContent %s', this.endpoint);

        return request
            .get(this.endpoint(projectId))
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    uploadContent(projectId, token, {content, key}) {
        debug('uploadContent(%s, %s) => %s', key, content, this.endpoint);
        const contentKey = this._sanitizeKey(key);
        return request
            .post(this.endpoint(projectId))
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
            .field('key', contentKey)
            .attach('content', content)
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    uploadContentStreaming(projectId, token, key, content, showProgress = false, contentType='application/octet-stream') {
        debug('uploadContentStreaming(%s, %s) => %s', key, content, `${this.endpoint}/${key}`);

        // NOTE: superagent only supports uploads via .attach(), which uses multipart forms (@see
        // https://github.com/visionmedia/superagent/issues/1250).  To perform a streaming upload,
        // we use requestjs instead.
        const requestLibRequest = require('request');

        const contentKey = this._sanitizeKey(key);
        const url = new URL(`${this.endpoint(projectId)}/${contentKey}`);

        let progressBar;
        if (showProgress) {
            progressBar = new ProgressBar(
                '  uploading [:bar] :percent :etas',
                { renderThrottle: 500, total: fs.statSync(content).size }
            );
        }

        return new Promise((resolve) => {
            fs
                .createReadStream(content)
                .on('data', (chunk) => {
                    progressBar && progressBar.tick(chunk.length);
                })
                .pipe(requestLibRequest
                    .post({
                        uri: url,
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': contentType,
                            'User-Agent': getUserAgent(),
                        }
                    }, function(err, res, body) {
                        if (err) {
                            resolve({success: false, message: err.message});
                            return;
                        }
                        if (res.statusCode === 200) {
                            resolve({success: true, message: body});
                            return;
                        }
                        // NOTE this is using npm request NOT superagent - fields are different
                        resolve({success: false, message: body, status: res.statusCode});
                    })
                );
        });
    }

    uploadSecureContent(projectId, token, key, content) {
        const contentKey = this._sanitizeKey(key);
        const url = `${this.cortexUrl}/v2/tenants/secrets/${contentKey}`;
        debug('uploadSecureContent(%s) => %s', content, url);
        return request
            .post(url)
            .set('Authorization', `Bearer ${token}`)
            .send(content)
            .accept('application/json')
            .type('json')
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }


    deleteContent(projectId, token, key) {
        debug('deleteContent(%s) => %s', key, this.endpoint);
        const contentKey = this._sanitizeKey(key);
        const url = `${this.endpoint(projectId)}/${contentKey}`;
        return request
            .delete(url)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.body};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    downloadContent(projecId, token, key, showProgress = false) {
        debug('downloadContent(%s) => %s', key, this.endpoint);
        const contentKey = this._sanitizeKey(key);
        const url = `${this.endpoint(projecId)}/${contentKey}`;

        const stream = request
            .get(url)
            .set('Authorization', `Bearer ${token}`)
            .use((req) => {
                if (showProgress) {
                    req.on('request', (clientReq) => {
                        clientReq.on('response', function(res) {
                            const total = +(res.headers['content-length'] || res.headers['Content-Length']);
                            const progressBar = new ProgressBar(
                                '  downloading [:bar] :percent :etas',
                                {
                                    current: 0,
                                    renderThrottle: 500,
                                    total: total,
                                }
                            );
                        
                            res.on('data', (chunk) => progressBar.tick(chunk.length));
                          });
                    });
                }
            });

        return new Promise((resolve, reject) => {
            stream.on('response', function(response) {
                if (response.status !== 200) {
                    stream.abort();
                    return resolve({
                        success: false,
                        status: stream.response.status,
                        message: stream.response.error
                    });
                }
            });

            stream.on('end', () => {
                return resolve({
                    success: true,
                    message: `\nDownloaded ${contentKey}`,
                    status: stream.response.status
                });
            });

            stream.on('error', (err) => {
                return resolve(constructError(err));
            });

            stream.pipe(process.stdout);
        });
    }


    downloadSecureContent(projectId, token, key) {
        const contentKey = this._sanitizeKey(key);
        const url = `${this.cortexUrl}/v2/tenants/secrets/${contentKey}`;
        debug('downloadContent(%s) => %s', contentKey, url);
        return request
            .get(url)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.text};
                }
                return {success: false, message: res.body, status: res.status};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

};

