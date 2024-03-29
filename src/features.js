import debugSetup from 'debug';

const debug = debugSetup('cortex:config');

export function allGAFeaturesEnabled(featureFlags) {
  return (featureFlags?.ga?.enabled ?? false) || process.env.ALL_GA_FEATURES_ENABLED;
}

export function previewFeaturesEnabled(featureFlags) {
  return (featureFlags?.preview?.enabled ?? false) || process.env.PREVIEW_FEATURES_ENABLED;
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

// exported for testing purposes
// Group -> Feature Flag -> CLI Subcommands
export const FLAG_SUBCOMMANDS = {
  ga: { }, // TODO: to be finalized
  preview: {
    'data-fabric-pipelines': ['pipelines'],
  },
  default: {
   // default commands - always enabled. These should be grouped into 'ga'
   // features, but those are TBD, so existing commands count as default.
    all: [
      'actions', 'agents', 'applications', 'assessments', 'campaigns', 'configure', 'connections', 'content', 'deploy',
      'docker', 'experiments', 'missions', 'models', 'projects', 'roles', 'secrets', 'sessions',
      'skills', 'stereotypes', 'tasks', 'types', 'users', 'workspaces',
    ],
  },
};

export function getDefaultFeatures() {
  return {
    ga: {},
    preview: {
      enabled: false,
      features: {
        'data-fabric-pipelines': {
          enabled: false,
        },
      },
    },
  };
}

export function getAllSubcommands() {
  return [...FLAG_SUBCOMMANDS.default.all, ...FLAG_SUBCOMMANDS.preview['data-fabric-pipelines']];
}

export class FeatureController {
  constructor(profile) {
    this.profile = profile;
  }

  /**
   * Computes the set of subcommands that are supported.
   *
   * @param {object} featureFlagSet feature flag group (e.g. ga or preview)
   * @param {Object.<string,string[]>} flagSubcommands map of feature flags to corresponding subcommands
   * @param {boolean} allEnabled whether all feature flags in the group should be treated as enabled
   * @return {string[]} list of strings
   */
  collectSubcommands(featureFlagSet, flagSubcommands, allEnabled = false) {
    if (allEnabled) {
      // collect all subcommands
      return Object.keys(flagSubcommands)
        .map((k) => flagSubcommands[k])
        .flat();
    }
    // only include subcommands for features that individuall enabled
    return Object.keys(flagSubcommands)
      .filter((k) => featureFlagSet?.features?.[k]?.enabled ?? false)
      .map((k) => flagSubcommands[k])
      .flat();
  }

  /**
   * Return the list of supported subcommands for the Profile.
   * @returns {string[]}
   */
  getSupportedSubCommands() {
    // Collect GA Features & Preview Features, but always include defaults
    const previewSubcommands = this.collectSubcommands(this.profile.featureFlags?.preview ?? {}, FLAG_SUBCOMMANDS.preview, previewFeaturesEnabled(this.profile.featureFlags));
    debug(`collected preview subcommands: ${JSON.stringify(previewSubcommands)}`);
    const gaSubcommands = this.collectSubcommands(this.profile.featureFlags?.ga ?? {}, FLAG_SUBCOMMANDS.ga, allGAFeaturesEnabled(this.profile.featureFlags));
    debug(`collected ga subcommands: ${JSON.stringify(gaSubcommands)}`);
    const supportedCommands = [
      ...FLAG_SUBCOMMANDS.default.all,
      ...gaSubcommands,
      ...previewSubcommands,
    ];
    return supportedCommands;
  }
}
