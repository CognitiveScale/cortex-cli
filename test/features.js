import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import npmFetch from 'npm-registry-fetch';
import sinon from 'sinon';
import { FLAG_SUBCOMMANDS, FeatureController } from '../src/features.js';
import { readPackageJSON } from '../src/commands/utils.js';

chai.use(chaiAsPromised);

const pkg = readPackageJSON('../../package.json');
let sandbox;

describe('Feature Flags', () => {
  const profile = {
    url: 'http://example.com',
    account: 'testAccount',
    projectId: 'testTenant',
    username: 'testUser',
    token: 'testToken',
  };

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

  const previewDisabledFlags = {
    ga: { enabled: true, features: {} },
    preview: {
      enabled: false,
      features: {
        'data-fabric-pipelines': {
          enabled: false,
        },
      },
    },
  };
  // TODO: Use structuredClone() instead of JSON stringify & parse, once node 18 is minimum
  const allPreviewEnabledFlags = JSON.parse(JSON.stringify(previewDisabledFlags));
  allPreviewEnabledFlags.preview.enabled = true;

  // TODO: Use structuredClone() instead of JSON stringify & parse, once node 18 is minimum
  const allPreviewEnabledFlags = JSON.parse(JSON.stringify(previewDisabledFlags));
  individualPreviewEnabledFlags.preview.features['data-fabric-pipelines'].enabled = true;
  console.log(JSON.stringify(individualPreviewEnabledFlags));

  describe('getSupportedSubcommands', () => {
    it('displays default subcommands if the server does not respond with feature flags', () => {
      delete profile.featureFlags; // explicitly remove feature flags for testing purposes
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      const expected = FLAG_SUBCOMMANDS.default.all;
      chai.expect(subcommands).to.include.members(expected);
    });

    it('displays default subcommands by default', () => {
      profile.featureFlags = previewDisabledFlags; // assign feature flags for testing purposes
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      const expected = FLAG_SUBCOMMANDS.default.all;
      chai.expect(subcommands).to.include.members(expected);
    });

    it('displays default and preview subcommands when all Preview Features all enabled', () => {
      profile.featureFlags = allPreviewEnabledFlags; // assign feature flags for testing purposes
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      const expected = [...FLAG_SUBCOMMANDS.default.all, ...FLAG_SUBCOMMANDS.preview['data-fabric-pipelines']];
      chai.expect(subcommands).to.include.members(expected);
    });

    it('displays default and preview subcommands when individual Preview Features are enabled', () => {
      profile.featureFlags = individualPreviewEnabledFlags; // assign feature flags for testing purposes
      console.log(JSON.stringify(profile.featureFlags));
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      const expected = [...FLAG_SUBCOMMANDS.default.all, ...FLAG_SUBCOMMANDS.preview['data-fabric-pipelines']];
      chai.expect(subcommands).to.include.members(expected);
    });
  });
});
