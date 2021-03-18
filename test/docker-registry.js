/*
 * Copyright 2021 Cognitive Scale, Inc. All Rights Reserved.
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

const { assert } = require('chai');
const Actions = require('../src/client/actions');

const action = new Actions('https://api.cortex-dev.insights.ai');


describe('_cortexRegistryImagePath()', () => {
    it('returns the full URL of the image in the private registry', () => {
        const registryUrl = 'private-registry.cortex.insights.ai';
        const tenant = 'tenant';

        const i1 = 'image';
        const i2 = 'c12e/image';
        const i3 = 'docker.io/library/image';

        const t1 = 'image:1234';
        const t2 = 'c12e/image:1234';
        const t3 = 'docker.io/library/image:1234';

        [i1, i2, i3].forEach((i) => {
            assert.equal(action._cortexRegistryImagePath(registryUrl, i, tenant), 'private-registry.cortex.insights.ai/tenant/image');
        });

        [t1, t2, t3].forEach((i) => {
            assert.equal(action._cortexRegistryImagePath(registryUrl, i, tenant), 'private-registry.cortex.insights.ai/tenant/image:1234');
        });
    });
});
