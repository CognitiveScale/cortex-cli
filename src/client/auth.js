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
const { getRequest }  = require('../commands/utils/apiutils');

const debug = require('debug')('cortex:cli');
const _ = require('lodash');
const chalk = require('chalk');
const { constructError } = require('../commands/utils/baseutils');

module.exports = class Auth {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
    }

    login(tenantId, username, password) {
        const endpoint = `${this.cortexUrl}/v2/admin/${tenantId}/users/authenticate`;
    
        debug('login(%s) => %s', username, endpoint);
    
        return request
            .post(endpoint)
            .set('x-cortex-proxy-notify', true)
            .send({
                username: username,
                password: password
            })
            .then((response) => {
                if (Boolean(_.get(response, 'headers.x-cortex-proxied', false)))
                    console.error(chalk.blue('Request proxied to cloud.'));

                if (response.ok) {
                    debug('login response: %o', response.body);
                    return response.body;
                }
                else {
                    throw new Error('Authentication failed');
                }
            })
            .catch((err) => {
                return constructError(err);
            });
    }
};