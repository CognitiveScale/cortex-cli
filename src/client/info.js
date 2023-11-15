/*
 * Copyright 2023 Cognitive Scale, Inc. All Rights Reserved.
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
import debugSetup from 'debug';
import { got, getUserAgent } from './apiutils.js';
import { constructError, printError } from '../commands/utils.js';

const debug = debugSetup('cortex:cli');
export default (class Info {
    constructor(cortexUrl) {
        this.endpoint = () => `${cortexUrl}`;
        this.cortexUrl = cortexUrl;
    }

    async getInfo() {
        const endpoint = `${this.cortexUrl}/fabric/v4/info`;
        debug('getInfo() => %s', endpoint);
        try {
            return await got
                .get(endpoint, {
                    headers: { 'user-agent': getUserAgent() },
                    followRedirect: false,
                    retry: {
                        limit: 0, // no retries
                    },
                    timeout: {
                        connect: 100, // milliseconds
                    },
                })
                .json();
        } catch (err) {
            // TODO: was this explicitly returning the error for some reason?
            // Callers do NOT handle error, so my only assumption is that this
            // should be exit here
            const { message } = constructError(err);
            return printError(`Failed to retrieve cluster information from ${this.cortexUrl}: ${message}`, {}, true);
        }
    }
});
