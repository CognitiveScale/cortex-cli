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
const { got, getUserAgent } = require('./apiutils');
const { constructError } = require('../commands/utils');

module.exports = class Info {
    constructor(cortexUrl) {
        this.endpoint = () => `${cortexUrl}`;
        this.cortexUrl = cortexUrl;
    }

    getInfo() {
        const endpoint = `${this.cortexUrl}/fabric/v4/info`;
        debug('getInfo() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { 'user-agent': getUserAgent() },
                followRedirect: false,
            }).json()
            .then((result) => result)
            .catch((err) => constructError(err));
    }
};
