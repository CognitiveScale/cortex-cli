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
            });
    }

    downloadContent(token, contentKey) {
        debug('downloadContent(%s) => %s', contentKey, this.endpoint);
        const url = `${this.endpoint}/${contentKey}`;
        return request
            .get(url)
            .set('Authorization', `Bearer ${token}`)
            .accept('application/json')
            .then((res) => {
                if (res.ok) {
                    return {success: true, message: res.text};
                }
                return {success: false, message: res.body, status: res.status};
            });
    }


};

