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

const request = require('superagent');
const debug = require('debug')('cortex:cli');
const { constructError } = require('../commands/utils');

module.exports = class Content {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/content`;
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
        debug('saveContent(%s, %s) => %s', key, content, this.endpoint);
        return request
            .post(this.endpoint)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
            .field('key', key)
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

    uploadSecureContent(token, key, content) {
        const url = `${this.cortexUrl}/v2/tenants/secrets/${key}`;
        debug('uploadSecureContent(%s => %s', content, url);
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


    deleteContent(token, contentKey) {
        debug('deleteContent(%s) => %s', contentKey, this.endpoint);
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

    downloadContent(token, contentKey) {
        debug('downloadContent(%s) => %s', contentKey, this.endpoint);
        // strip leading slash, if any
        const cleanedKey = contentKey.replace(/^\//, '');
        const url = `${this.endpoint}/${cleanedKey}`;
        const stream = request
            .get(url)
            .set('Authorization', `Bearer ${token}`);

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


    downloadSecureContent(token, contentKey) {
        // strip leading slash, if any
        const cleanedKey = contentKey.replace(/^\//, '');
        const url = `${this.cortexUrl}/v2/tenants/secrets/${cleanedKey}`;
        debug('downloadContent(%s) => %s', contentKey);
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

