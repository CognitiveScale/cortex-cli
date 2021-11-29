const path = require('path');

const Docker = require('dockerode');
const { getSkillInfo } = require('./utils');

const _ = {
  map: require('lodash/map'),
};

module.exports.WorkspacePublishCommand = class WorkspacePublishCommand {
  constructor(program) {
    this.program = program;
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
    const docker = new Docker();

    if (skillInfo.length > 0) {
      await Promise.all(_.map(skillInfo, (info) => {
        const actions = info.skill.actions ? info.skill.actions : [];
        return Promise.all(_.map(actions, async (action) => {
          const imglist = await docker.listImages({
            filters: JSON.stringify({
              reference: [action.image],
            }),
          });

          console.log(imglist);
        }));
      }));
    } else {
      console.log('No skills found');
    }
  }
};
