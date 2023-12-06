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
import { got } from './apiutils.js';
import { constructError } from '../commands/utils.js';

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
                .get({ url: endpoint })
                .json();
        } catch (err) {
            // return error object and let caller deal with failure
            const e = constructError(err);
            debug(`Failed to retrieve cluster information from ${this.cortexUrl}: ${e.message}`);
            return e;
        }
    }
});
