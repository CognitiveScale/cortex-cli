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

const debug = require('debug')('cortex:cli');
const got = require('got');
const { constructError } = require('../commands/utils');

module.exports = class Accounts {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/accounts`;
        this.whoAmIEndpoint = `${this.endpoint}/user/whoami`;
    }

    whoAmI(token) {
        const endpoint = this.whoAmIEndpoint;
        debug('whoAmI => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }
};
