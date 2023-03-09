import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import semver from 'semver';
import nock from 'nock';
import npmFetch from 'npm-registry-fetch';
import sinon from 'sinon';
import pkg from '../package.json' assert { type: 'json' };
import * as compatibility from '../src/compatibility.js';

chai.use(chaiAsPromised);
const { expect } = chai;

let sandbox;

describe('compatibility checks', () => {
    const profile = {
        url: 'http://example.com',
        account: 'testAccount',
        projectId: 'testTenant',
        username: 'testUser',
        token: 'testToken',
    };
    describe('with a compatible application version', () => {
        before(() => {
            sandbox = sinon.createSandbox();
            sandbox.stub(npmFetch, 'json')
                .returns(Promise.resolve({ versions: { [pkg.version]: {} } }));
            nock(profile.url)
                .get('/fabric/v4/compatibility/applications/cortex-cli')
                .reply(200, () => ({ semver: pkg.version }));
        });
        after(() => {
            sandbox.restore();
            nock.cleanAll();
            nock.enableNetConnect();
        });
        it('should resolve as satisfied', () => {
            const expected = { current: pkg.version, latest: pkg.version, satisfied: true };
            return expect(compatibility.getCompatibility(profile)).to.become(expected);
        });
    });
    describe('with an incompatible application version', () => {
        const nextMajorVersion = semver.inc(pkg.version, 'major');
        before(() => {
            nock(profile.url)
                .get('/fabric/v4/compatibility/applications/cortex-cli')
                .reply(200, () => ({ semver: nextMajorVersion }));
            sandbox = sinon.createSandbox();
            sandbox.stub(npmFetch, 'json')
                .returns(Promise.resolve({
                        versions: {
                            [pkg.version]: {},
                            [nextMajorVersion]: {},
                        },
            }));
        });
        after(() => {
            sandbox.restore();
            nock.cleanAll();
            nock.enableNetConnect();
        });
        it('should resolve as unsatisfied', () => {
            const expected = { current: pkg.version, latest: nextMajorVersion, satisfied: false };
            return expect(compatibility.getCompatibility(profile)).to.become(expected);
        });
        // it('should resolve as box', () => {
        //     // Just added a dumb test to test output..
        //     compatibility.notifyUpdate({ required: false, current: '1.0.0', latest: '2.0.0' });
        // });
    });
    describe('when the compatibility service cannot be reached', () => {
        before(() => {
            nock(profile.url)
                .get('/fabric/v4/compatibility/applications/cortex-cli')
                .reply(500, () => ('BOOM'));
            sandbox = sinon.createSandbox();
            sandbox.stub(npmFetch, 'json')
                .returns(Promise.resolve({ versions: { [pkg.version]: {} } }));
        });
        after(() => {
            sandbox.restore();
            nock.cleanAll();
            nock.enableNetConnect();
        });
        it('should reject', () => expect(compatibility.getCompatibility(profile)).to.be.rejected);
    });
    describe('when the npm cannot be reached', () => {
        before(() => {
            nock(profile.url)
                .get('/fabric/v4/compatibility/applications/cortex-cli')
                .reply(200, () => ({ semver: pkg.version }));
            sandbox = sinon.createSandbox();
            sandbox.stub(npmFetch, 'json')
                .throws(new Error('BOOM!'));
        });
        after(() => {
            sandbox.restore();
            nock.cleanAll();
            nock.enableNetConnect();
        });
        it('should not reject', () => {
            // should default to current package version...
            const expected = { current: pkg.version, latest: pkg.version, satisfied: true };
            return expect(compatibility.getCompatibility(profile)).to.become(expected);
        });
    });
});
