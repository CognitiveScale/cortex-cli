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

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const findPackageJson = require('find-package-json');
const rewire = require('rewire');
const nock = require('nock');

const compatibilityModule = rewire('../src/compatibility');

chai.use(chaiAsPromised);

const pkg = findPackageJson(__dirname).next().value;

describe('useragent', () => {
    const profile = {
        url: 'http://example.com',
        account: 'testAccount',
        projectId: 'testTenant',
        username: 'testUser',
        token: 'testToken',
    };

    let revertCompatibilityModule;

    before(() => {
        // Compatibility API call is as good as any to verify the request has user-agent,
        // so mock it the same way we do for that test, adding capture of headers.
        revertCompatibilityModule = compatibilityModule.__set__({
            npmFetch: {
                json: () => Promise.resolve({ versions: { [pkg.version]: {} } }),
            },
        });
    });

    after(() => {
        revertCompatibilityModule();
    });

    it('should exist in request headers', async () => {
        nock.activate();
        const n = nock(profile.url)
            .get('/fabric/v4/compatibility/applications/cortex-cli')
            .reply(200, () => ({ semver: pkg.version }))
            .matchHeader('user-agent', (val) => {
                console.log(val);
                return val.includes(`${pkg.name}/${pkg.version}`);
            });
        await compatibilityModule.getCompatibility(profile);
        n.done();
    });
});
