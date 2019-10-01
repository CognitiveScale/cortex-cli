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
const semver = require('semver');
const superagent = require('superagent');
const superagentMock = require('superagent-mocker');

const compatibilityModule = rewire('../src/compatibility');

chai.use(chaiAsPromised);
const expect = chai.expect;

const pkg = findPackageJson(__dirname).next().value;

describe('compatibility checks', function () {
    const profile = {
        url: 'http://example.com',
        account: 'testAccount',
        tenantId: 'testTenant',
        username: 'testUser',
        token: 'testToken'
    };

    describe('with a compatible application version', function () {
        let requestMock;
        let revertCompatibilityModule;

        before(function () {
            requestMock = superagentMock(superagent);
            requestMock.get(
                `${profile.url}/v3/catalog/compatibility/applications/cortex-cli`,
                () => ({ ok: true, body: { semver: pkg.version } })
            );
            revertCompatibilityModule = compatibilityModule.__set__({
                npmFetch: {
                    json: () => Promise.resolve({ versions: { [pkg.version]: {} } })
                },
            });
        });

        after(function () {
            revertCompatibilityModule();
            requestMock.unmock(superagent);
        });

        it('should resolve as satisfied', function () {
            const expected = { current: pkg.version, latest: pkg.version, satisfied: true };
            return expect(compatibilityModule.getCompatibility(profile)).to.become(expected);
        });
    });

    describe('with an incompatible application version', () => {
        const nextMajorVersion = semver.inc(pkg.version, 'major');
        let requestMock;
        let revertCompatibilityModule;

        before(() => {
            requestMock = superagentMock(superagent);
            requestMock.get(
                `${profile.url}/v3/catalog/compatibility/applications/cortex-cli`,
                () => ({ ok: true, body: { semver: nextMajorVersion } })
            );
            revertCompatibilityModule = compatibilityModule.__set__({
                npmFetch: {
                    json: () => Promise.resolve({
                        versions: {
                            [pkg.version]: {},
                            [nextMajorVersion]: {}
                        }
                    })
                },
            });
        });

        after(() => {
            revertCompatibilityModule();
            requestMock.unmock(superagent);
        });

        it('should resolve as unsatisfied', () => {
            const expected = { current: pkg.version, latest: nextMajorVersion, satisfied: false };
            return expect(compatibilityModule.getCompatibility(profile)).to.become(expected);
        });
    });

    describe('when the compatibility service cannot be reached', () => {
        let requestMock;
        let revertCompatibilityModule;

        before(() => {
            requestMock = superagentMock(superagent);
            requestMock.get(
                `${profile.url}/v3/catalog/compatibility/applications/cortex-cli`,
                () => { throw new Error('BOOM!'); }
            );
            revertCompatibilityModule = compatibilityModule.__set__({
                npmFetch: {
                    json: () => Promise.resolve({ versions: { [pkg.version]: {} } })
                },
            });
        });

        after(() => {
            revertCompatibilityModule();
            requestMock.unmock(superagent);
        });

        it('should reject', () => {
            return expect(compatibilityModule.getCompatibility(profile)).to.be.rejected;
        });
    });

    describe('when the npm cannot be reached', () => {
        let requestMock;
        let revertCompatibilityModule;

        before(() => {
            requestMock = superagentMock(superagent);
            requestMock.get(
                `${profile.url}/v3/catalog/compatibility/applications/cortex-cli`,
                () => ({ ok: true, body: { semver: pkg.version } })
            );
            revertCompatibilityModule = compatibilityModule.__set__({
                npmFetch: {
                    json: () => Promise.reject(new Error('BOOM!'))
                },
            });
        });

        after(() => {
            revertCompatibilityModule();
            requestMock.unmock(superagent);
        });

        it('should not reject', () => {
            // should default to current package version...
            const expected = { current: pkg.version, latest: pkg.version, satisfied: true };
            return expect(compatibilityModule.getCompatibility(profile)).to.become(expected);
        });
    });
});