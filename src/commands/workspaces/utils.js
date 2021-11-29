const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const {
  readFile, stat,
} = require('fs/promises');
const cliProgress = require('cli-progress');
const { BarFormat } = require('cli-progress').Format;

const ghGot = require('gh-got');

const _ = {
  get: require('lodash/get'),
  map: require('lodash/map'),
  mean: require('lodash/mean'),
};

module.exports.validateToken = function validateToken(config) {
  const githubToken = _.get(config, 'templateConfig.githubToken');
  if (githubToken) {
    return ghGot('user', { token: githubToken.access_token }).catch(() => undefined).then((u) => ((u && u.statusCode === 200) ? githubToken.access_token : undefined));
  }
  return undefined;
};

module.exports.printToTerminal = function printToTerminal(txt) {
  process.stdout.write(`${txt}\x1b[0K\x1b[1E`);
};

module.exports.saveTerminalPosition = function saveTerminalPosition() {
  process.stdout.write('\x1b7');
};

module.exports.restoreTerminalPosition = function saveTerminalPosition() {
  process.stdout.write('\x1b8');
};

module.exports.DockerProgressTracker = class DockerProgressTracker {
  constructor() {
    this.layers = { download: {}, extract: {} };
    this.downloaded = 0;
    this.extracted = 0;
    this.streamData = '';

    this.bars = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: (opts, params, payload) => this.statusFormatter(opts, params, payload),
    }, cliProgress.Presets.shades_grey);

    this.dlBar = this.bars.create(100, 0, { type: 'download' });
    this.exBar = this.bars.create(100, 0, { type: 'extract' });
    this.statusBar = this.bars.create(0, 0, { type: 'status' });
  }

  statusFormatter(barOpts, params, payload) {
    switch (payload.type) {
      case 'download':
        return `Downloading: [${BarFormat(params.progress, barOpts)}]`;
      case 'extract':
        return `Extracting:  [${BarFormat(params.progress, barOpts)}]`;
      case 'status':
        return `Status:      ${this.streamData.trim()}`;
      default:
        return '';
    }
  }

  updateProgress() {
    this.dlBar.update(this.downloaded);
    this.exBar.update(this.extracted);
    this.statusBar.update(null);
  }

  stop() {
    this.bars.stop();
  }

  complete() {
    this.downloaded = 100;
    this.extracted = 100;
    this.updateProgress();
  }

  processEvent(evt) {
    const { progressDetail } = evt;
    let { status, id } = evt;
    
    status = status || '';
    id = id || '';

    if (evt.stream) {
      const newStr = evt.stream.replace(/\n|\r/g, '');
      if (newStr) {
        this.streamData = newStr;
      }
      this.updateProgress();
    }

    if (status.startsWith('Pulling from ')) {
      status = 'Pulling';
    }

    if (status.startsWith('Status: Image is up to date for ')
    ) {
      status = 'Image up to date';
    }

    if (status.startsWith('Status: Downloaded newer image for ')
    ) {
      status = 'Downloaded newer image';
    }

    if (status.startsWith('Digest: ')
    ) {
      status = 'Digest';
    }

    switch (status) {
      case 'Pulling fs layer':
        this.layers.download[id] = { progress: 0 };
        this.layers.extract[id] = { progress: 0 };
        break;

      case 'Downloading':
        this.layers.download[id].progress = progressDetail.current / progressDetail.total || 0;
        break;

      case 'Extracting':
        this.layers.extract[id].progress = progressDetail.current / progressDetail.total || 0;
        break;

      case 'Download complete':
        this.layers.download[id].progress = 1;
        break;

      case 'Pull complete':
        this.layers.extract[id].progress = 1;
        break;

      case 'Already exists':
        this.layers.download[id].progress = 1;
        this.layers.extract[id].progress = 1;
        break;

      case 'Image up to date':
      case 'Downloaded newer image':
        this.downloaded = 100;
        this.extracted = 100;
        return this.updateProgress();

      /// Ignore these status messages
      case 'Ready to download':
      case 'Waiting':
      case 'Pulling':
      case 'Verifying Checksum':
      case 'Digest':
      case '':
        return this.updateProgress();

      default:
        console.error('Unhandled status message: ', status);
    }

    const dlmap = _.map(this.layers.download, 'progress');
    const exmap = _.map(this.layers.extract, 'progress');

    this.downloaded = Math.round(100 * _.mean(dlmap));
    this.extracted = Math.round(100 * _.mean(exmap));

    return this.updateProgress();
  }
};

module.exports.getSkillInfo = function getSkillInfo(target) {
  if (target.endsWith('skill.yaml')) {
    const fname = path.resolve(target);
    return stat(fname)
      .then(() => [fname])
      .catch(() => []);
  }
  const skillFiles = glob.sync('/skills/**/skill.yaml', {
    root: target,
    absolute: true,
  });
  return Promise.all(_.map(skillFiles, async (uri) => {
    const skill = await readFile(uri).catch(() => { });
    return {
      name: path.basename(uri),
      uri,
      skill: skill ? yaml.load(skill.toString()) : undefined,
    };
  }));
};
