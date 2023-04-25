import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import sinon from 'sinon';
import npmFetch from 'npm-registry-fetch';
import * as compatibility from '../src/compatibility.js';
import { readPackageJSON } from '../src/commands/utils.js';

const pkg = readPackageJSON('../../package.json');

chai.use(chaiAsPromised);

let sandbox;
describe('useragent', () => {
    const profile = {
        url: 'http://example.com',
        account: 'testAccount',
        projectId: 'testTenant',
        username: 'testUser',
        token: 'testToken',
    };
    before(() => {
        if (!nock.isActive()) {
            nock.activate();
        }
        // Compatibility API call is as good as any to verify the request has user-agent,
        // so mock it the same way we do for that test, adding capture of headers.
        sandbox = sinon.createSandbox();
        sandbox.stub(npmFetch, 'json')
            .returns(Promise.resolve({ versions: { [pkg.version]: {} } }));
    });
    after(() => {
        sandbox.restore();
        nock.cleanAll();
    });
    it('should exist in request headers', async () => {
        nock(profile.url)
            .get('/fabric/v4/compatibility/applications/cortex-cli')
            .reply(200, () => ({ semver: pkg.version }))
            .matchHeader('user-agent', (val) => {
            console.log(val);
            return val.includes(`${pkg.name}/${pkg.version}`);
        });
        await compatibility.getCompatibility(profile);
    });
});
