const path = require('path');
const glob = require('glob');
const Docker = require('dockerode');
const cliProgress = require('cli-progress');
const { BarFormat } = require('cli-progress').Format;

const _ = {
  get: require('lodash/get'),
  groupBy: require('lodash/groupBy'),
  orderBy: require('lodash/orderBy'),
  map: require('lodash/map'),
  filter: require('lodash/filter'),
  forEach: require('lodash/forEach'),
  template: require('lodash/template'),
  isEmpty: require('lodash/isEmpty'),
  set: require('lodash/set'),
  mean: require('lodash/mean'),
};

const { getSkillInfo, getCurrentRegistry } = require('./workspace-utils');

class DockerBuildProgressTracker {
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
        if (params.progress >= 1) {
          return 'Downloading: Complete';
        }
        return `Downloading: [${BarFormat(params.progress, barOpts)}]`;
      case 'extract':
        if (params.progress >= 1) {
          return 'Extracting:  Complete';
        }
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
    }

    if ((status === 'Image up to date') || (status === 'Downloaded newer image')) {
      this.downloaded = 100;
      this.extracted = 100;
    }

    if (status === 'Pulling fs layer') {
      this.layers.download[id] = { progress: 0 };
      this.layers.extract[id] = { progress: 0 };
    }

    if (status === 'Downloading') {
      this.layers.download[id].progress = progressDetail.current / progressDetail.total || 0;
    }

    if (status === 'Extracting') {
      this.layers.extract[id].progress = progressDetail.current / progressDetail.total || 0;
    }

    if (status === 'Download complete') {
      this.layers.download[id].progress = 1;
    }

    if (status === 'Pull complete') {
      this.layers.extract[id].progress = 1;
    }

    if (status === 'Already exists') {
      this.layers.download[id].progress = 1;
      this.layers.extract[id].progress = 1;
    }

    const dlmap = _.map(this.layers.download, 'progress');
    const exmap = _.map(this.layers.extract, 'progress');

    this.downloaded = Math.round(100 * _.mean(dlmap));
    this.extracted = Math.round(100 * _.mean(exmap));

    return this.updateProgress();
  }
}

module.exports.WorkspaceBuildCommand = class WorkspaceBuildCommand {
  constructor(program) {
    this.program = program;
  }

  buildImageTag(registry, actionName) {
    if (registry.url.includes('docker.io')) {
      return path.posix.join(registry.namespace || '', actionName);
    }
  
    if (actionName.startsWith(registry.url)) {
      return actionName;
    }
  
    return path.posix.join(registry.url, registry.namespace || '', actionName);
  }

  async buildAction(target, action, imageTag, status) {
    try {
      const actionPath = path.join(target, 'actions', action.name);
      const globList = glob.sync('/**/*', {
        root: actionPath,
        absolute: true,
      });

      const buildList = _.map(globList, (g) => path.posix.join(...(path.relative(actionPath, g)).split(path.sep)));
      const docker = new Docker();

      const stream = await docker.buildImage(
        {
          context: actionPath,
          src: buildList,
        },
        { t: imageTag },
      );

      return new Promise((resolve, reject) => {
        try {
          docker.modem.followProgress(
            stream,
            (err) => {
              if (err) {
                return reject(err);
              }
              status.complete();
              return resolve(true);
            },
            (evt) => {
              status.processEvent(evt);
            },
          );
        } catch (err) {
          console.log(err);
          reject(err);
        }
      });
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  }

  async execute(folder, options) {
    this.options = options;
    let target = process.cwd();

    if (folder) {
      const fldr = folder.replace(/'|"/g, '');
      target = path.isAbsolute(fldr) ? folder : path.resolve(target, fldr);
    }

    if (options.skill) {
      target = path.join(target, 'skills', options.skill, 'skill.yaml');
    }

    const skillInfo = await getSkillInfo(target);

    const curReg = getCurrentRegistry();
    console.log(curReg);

    if (skillInfo.length > 0) {
      console.log('Building...');
      const status = new DockerBuildProgressTracker();
      await Promise.all(_.map(skillInfo, (info) => {
        const actions = info.skill.actions ? info.skill.actions : [];
        return Promise.all(_.map(actions, (action) => {
          const imageTag = action.image;
          return this.buildAction(
            path.dirname(info.uri),
            action,
            imageTag,
            status,
          );
        }));
      }));
      status.stop();
      console.log('Build Complete');
    } else {
      console.log('No skills found');
    }
  }
};
