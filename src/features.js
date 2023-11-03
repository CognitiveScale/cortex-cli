export function allGAFeaturesEnabled() {
    return process.env.ALL_GA_FEATURES_ENABLED;
}

export function previewFeaturesEnabled() {
  return process.env.PREVIEW_FEATURES_ENABLED;
}

export class FeatureFlag {
  /**
   *  Creates a Feature Flag.
   * 
   * @param {string} flagName 
   * @param {string} status GA | Preview
   * @param {string[]} subcommands CLI subcommands corresponding to the Feature Flag
   */
  constructor(flagName, status, subcommands) {
    this.name = flagName;
    this.status = status;
    this.subcommands = subcommands;
  }
}

const ALL_FEATURES = {
  ga: {
    accounts: ['projects', 'roles', 'users'],
    campaigns: ['campaigns', 'missions'],
    dataFabric: ['connections', 'content', 'secrets'],
    models: ['experiments', 'models'],
    runtime: ['actions', 'agents', 'docker', 'sessions', 'skills', 'tasks', 'types', 'workspaces', 'deploy'],
  },
  preview: {
    pipelines: ['pipelines'],
  },
  default: ['configure', 'assessments'],
};

const GA_FEATURES = Object.keys(ALL_FEATURES.ga)
  .map((f) => new FeatureFlag(f, 'GA', ALL_FEATURES.ga[f]));

const PREVIEW_FEATURES = Object.keys(ALL_FEATURES.preview)
  .map((f) => new FeatureFlag(f, 'PREVIEW', ALL_FEATURES.preview[f]));

export class FeatureController {
  constructor(profile) {
    this.profile = profile;
  }

  /**
   * Computes the set of subcommands that are supported.
   * @param {string[]} enabledFeatures
   * @param {FeatureFlag[]} featureFlags
   * @return {string[]}
   */
  collectSubcommands(enabledFeatures, featureFlags) {
    console.log(enabledFeatures);
    return featureFlags
      .filter((flag) => enabledFeatures.includes(flag.name))
      .map((flag) => flag.subcommands) // string[][]
      .flat();
  }

  /**
   * Return the list of supported subcommands for the Profile.
   * @returns {string[]}
   */
  getSupportedSubCommands() {
    // Collect GA Features & Preview Features, but always include default options
    const enabledFeatures = (this.profile?.featureFlags?.ga ?? []) + (this.profile.featureFlags?.preview ?? []);
    const supportedCommands = [...ALL_FEATURES.default];
    if (allGAFeaturesEnabled()) {
      supportedCommands.push(...GA_FEATURES.map((f) => f.subcommands).flat());
    } else {
      this.collectSubcommands(enabledFeatures, GA_FEATURES);
    }
    if (previewFeaturesEnabled()) {
      this.collectSubcommands(enabledFeatures, PREVIEW_FEATURES);
    }
    return supportedCommands;
  }
}
