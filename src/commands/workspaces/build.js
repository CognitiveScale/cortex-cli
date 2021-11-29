const path = require('path');
const glob = require('glob');
const Docker = require('dockerode');

const { DockerProgressTracker, getSkillInfo } = require('./utils');

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

module.exports.WorkspaceBuildCommand = class WorkspaceBuildCommand {
  constructor(program) {
    this.program = program;
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

    if (skillInfo.length > 0) {
      console.log('Building...');
      const status = new DockerProgressTracker();
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
