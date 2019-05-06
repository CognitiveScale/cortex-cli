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

module.exports = class Content {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/content`;
    }

    _sanitizeKey(key) {
        // strip leading slash, if any
        return key.replace(/^\//, '');
    }

    listContent(token) {
        debug('listContent %s', this.endpoint);
        return request
            .get(this.endpoint)
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

    uploadContent(token, {content, key}) {
        debug('uploadContent(%s, %s) => %s', key, content, this.endpoint);
        const contentKey = this._sanitizeKey(key);
        return request
            .post(this.endpoint)
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

    uploadContentStreaming(token, key, content, showProgress = false, contentType='application/octet-stream') {
        debug('uploadContentStreaming(%s, %s) => %s', key, content, `${this.endpoint}/${key}`);

        // NOTE: superagent only supports uploads via .attach(), which uses multipart forms (@see
        // https://github.com/visionmedia/superagent/issues/1250).  To perform a streaming upload,
        // we use requestjs instead.
        const requestLibRequest = require('request');

        const contentKey = this._sanitizeKey(key);
        const url = new URL(`${this.endpoint}/${contentKey}`);

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
                        }
                    }, function(err, res, body) {
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

    uploadSecureContent(token, key, content) {
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


    deleteContent(token, key) {
        debug('deleteContent(%s) => %s', key, this.endpoint);
        const contentKey = this._sanitizeKey(key);
        const url = `${this.endpoint}/${contentKey}`;
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

    downloadContent(token, key, showProgress = false) {
        debug('downloadContent(%s) => %s', key, this.endpoint);
        const contentKey = this._sanitizeKey(key);
        const url = `${this.endpoint}/${contentKey}`;

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


    downloadSecureContent(token, key) {
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

