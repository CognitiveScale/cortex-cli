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

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const findPackageJson = require('find-package-json');
const rewire = require('rewire');
const superagent = require('superagent');
const superagentMock = require('superagent-mocker');

const compatibilityModule = rewire('../src/compatibility');

chai.use(chaiAsPromised);
const expect = chai.expect;

const pkg = findPackageJson(__dirname).next().value;

describe('useragent', function () {
    const profile = {
        url: 'http://example.com',
        account: 'testAccount',
        tenantId: 'testTenant',
        username: 'testUser',
        token: 'testToken'
    };

    let requestMock;
    let requestMockHeaders;
    let revertCompatibilityModule;

    before(function () {
        // Compatibility API call is as good as any to verify the request has user-agent,
        // so mock it the same way we do for that test, adding capture of headers.
        requestMock = superagentMock(superagent);
        requestMock.get(
            `${profile.url}/v3/catalog/compatibility/applications/cortex-cli`,
            (req) => {
                requestMockHeaders = req.headers; // Capture headers
                return ({ ok: true, body: { semver: pkg.version } });
            }
        );
        revertCompatibilityModule = compatibilityModule.__set__({
            npmFetch: {
                json: () => Promise.resolve({ versions: { [pkg.version]: {} } })
            },
        });

        requestMockHeaders = {};
    });

    after(function () {
        revertCompatibilityModule();
        requestMock.unmock(superagent);
    });

    it('should exist in request headers', function () {
        return compatibilityModule.getCompatibility(profile).then(() =>
            expect(requestMockHeaders['user-agent']).to.include(`${pkg.name}/${pkg.version}`));
    });
});
