import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import mockedEnv from 'mocked-env';
import npmFetch from 'npm-registry-fetch';
import sinon from 'sinon';
import { FLAG_SUBCOMMANDS, FeatureController } from '../src/features.js';
import { readPackageJSON } from '../src/commands/utils.js';

chai.use(chaiAsPromised);

const pkg = readPackageJSON('../../package.json');
let sandbox;

let restoreEnv;
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
    restoreEnv = mockedEnv({});
  });

  after(() => {
    sandbox.restore();
    nock.cleanAll();
    nock.enableNetConnect();
    restoreEnv();
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
  const individualPreviewEnabledFlags = JSON.parse(JSON.stringify(previewDisabledFlags));
  individualPreviewEnabledFlags.preview.features['data-fabric-pipelines'].enabled = true;

  const defaultSubcommands = FLAG_SUBCOMMANDS.default.all;
  const defaultAndPreviewSubcommands = [...FLAG_SUBCOMMANDS.default.all, ...FLAG_SUBCOMMANDS.preview['data-fabric-pipelines']];
  chai.expect(defaultSubcommands.length).to.not.equal(defaultAndPreviewSubcommands.length);

  describe('getSupportedSubcommands', () => {
    it('displays default subcommands if the server does not respond with feature flags', () => {
      delete profile.featureFlags; // explicitly remove feature flags for testing purposes
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      chai.expect(subcommands).to.eql(defaultSubcommands);
    });

    it('displays default subcommands when preview features are disabled by server', () => {
      delete process.env.PREVIEW_FEATURES_ENABLED;
      profile.featureFlags = previewDisabledFlags; // assign feature flags for testing purposes
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      chai.expect(subcommands).to.eql(defaultSubcommands);
    });

    it('displays preview subcommands if PREVIEW_FEATURES_ENABLED=1 and Preview Flags are DISABLED by server', () => {
      process.env.PREVIEW_FEATURES_ENABLED = '1';
      profile.featureFlags = previewDisabledFlags; // assign feature flags for testing purposes
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      chai.expect(subcommands).to.eql(defaultAndPreviewSubcommands);
    });

    it('displays default and preview subcommands when PREVIEW_FEATURES_ENABLED=1 and all preview flags are enabled', () => {
      process.env.PREVIEW_FEATURES_ENABLED = '1';
      profile.featureFlags = allPreviewEnabledFlags; // assign feature flags for testing purposes
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      chai.expect(subcommands).to.eql(defaultAndPreviewSubcommands);
    });

    it('displays default and preview subcommands when PREVIEW_FEATURES_ENABLED=1 and individual preview flags are enabled', () => {
      process.env.PREVIEW_FEATURES_ENABLED = '1';
      profile.featureFlags = individualPreviewEnabledFlags; // assign feature flags for testing purposes
      console.log(JSON.stringify(profile.featureFlags));
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      chai.expect(subcommands).to.eql(defaultAndPreviewSubcommands);
    });

    it('displays default and preview subcommands when PREVIEW_FEATURES_ENABLED is not set and and all preview flags are enabled', () => {
      delete process.env.PREVIEW_FEATURES_ENABLED;
      profile.featureFlags = allPreviewEnabledFlags; // assign feature flags for testing purposes
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      chai.expect(subcommands).to.eql(defaultAndPreviewSubcommands);
    });

    it('displays default and preview subcommands when PREVIEW_FEATURES_ENABLED is not set and individual preview flags are enabled', () => {
      delete process.env.PREVIEW_FEATURES_ENABLED;
      profile.featureFlags = individualPreviewEnabledFlags; // assign feature flags for testing purposes
      console.log(JSON.stringify(profile.featureFlags));
      const controller = new FeatureController(profile);
      const subcommands = controller.getSupportedSubCommands();
      chai.expect(subcommands).to.eql(defaultAndPreviewSubcommands);
    });
  });
});
