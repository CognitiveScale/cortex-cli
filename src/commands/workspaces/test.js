const path = require('path');
const Docker = require('dockerode');
const glob = require('glob');
const {
  readFile, 
} = require('fs/promises');

const { printSuccess, printError } = require('../utils');
const { getSkillInfo, buildImageTag } = require('./workspace-utils');

const _ = {
  map: require('lodash/map'),
  filter: require('lodash/filter'),
  forEach: require('lodash/forEach'),
  find: require('lodash/find'),
};

module.exports.WorkspaceTestCommand = class WorkspaceTestCommand {
  constructor(program) {
    this.program = program;
    this.docker = new Docker();
  }

  selectRoute(input) {
    if (input.routing.all) {
      return input.routing.all;
    }
    /// TODO: support additional routing types here
    return undefined;
  }

  async invokeJob(skill, route, payload) {
    const action = _.find(skill.actions, { name: route.action });
    const Image = await buildImageTag(action.image);

    try {
      console.log('Running Job', Image);

      const info = await this.docker.getImage(Image).inspect();

      const container = await this.docker.createContainer({ 
        Tty: true, 
        Image, 
        name: 'invoke-job', 
        Cmd: [...info.Config.Entrypoint, JSON.stringify(payload)],
        EntryPoint: [''], 
        HostConfig: { AutoRemove: true },
        Env: ['START_WITHOUT_ENVOY=true'],
      });
      
      const stream = await container.attach({ stream: true, stdout: true, stderr: true });
      stream.on('data', (data) => {
        console.log(data.toString());
      });

      await container.start();
      return await container.wait().finally(() => stream.destroy());
    } catch (err) {
      console.error('ERROR: ', err);
    }

    return undefined;
  }

  async invokeDaemon(skill, route) {
    const action = _.find(skill.actions, { name: route.action });
    const Image = await buildImageTag(action.image);

    try {
      console.log('Running Daemon', Image);
      const info = await this.docker.getImage(Image).inspect();

      const daemonPort = _.find(skill.properties, { name: 'daemon.port' }).defaultValue || 5000;
      // const daemonMethod = _.find(skill.properties, { name: 'daemon.method' }).defaultValue || 'POST';
      // const daemonPath = _.find(skill.properties, { name: 'daemon.path' }).defaultValue || 'invoke';

      const ExposedPorts = {};
      ExposedPorts[`${daemonPort}/tcp`] = {};

      const PortBindings = {};
      PortBindings[`${daemonPort}/tcp`] = [
        {
          HostIp: '127.0.0.1',
          HostPort: `${daemonPort}`,
        },
      ];

      const existingContainer = await this.docker.getContainer('invoke-daemon');
      if (await existingContainer.inspect().catch(() => {})) {
        await existingContainer.remove({ force: true });
      }

      const container = await this.docker.createContainer({ 
        Tty: true, 
        Image, 
        name: 'invoke-daemon', 
        Cmd: info.Config.Cmd,
        EntryPoint: [''], 
        ExposedPorts,
        HostConfig: { 
          AutoRemove: true,
          PortBindings,
        },
        Env: [
          'START_WITHOUT_ENVOY=true',
          'NEVER_KILL_ISTIO=true',
          'ISTIO_QUIT_API=',
        ],
      }).catch((err) => console.error('ERROR: ', err));
      
      const stream = await container.attach({ stream: true, stdout: true, stderr: true });
      stream.on('data', (data) => {
        console.log(data.toString());
      });

      await container.start();

      return await container.wait().finally(() => stream.destroy());
    } catch (err) {
      console.error('ERROR: ', err);
    }

    return undefined;
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
      await Promise.all(_.map(skillInfo, async (info) => {
        const { skill } = info;
        const skillDir = path.dirname(info.uri);

        await Promise.all(_.map(skill.inputs, async (input) => {
          if (!options.input || input.name === options.input) {
            const payloadFiles = glob.sync(`/invoke/${input.name}/*.json`, {
              root: skillDir,
              absolute: true,
            });
            await Promise.all(_.map(payloadFiles, async (payloadFile) => {
              try {
                const payload = JSON.parse(await readFile(payloadFile, { encoding: 'utf8' }).catch(() => {}));
                const route = this.selectRoute(input);
                let status = { StatusCode: 1 };

                switch (route.runtime) {
                  case 'cortex/jobs':
                    status = await this.invokeJob(skill, route, payload);
                  break;
                  case 'cortex/daemons':
                    status = await this.invokeDaemon(skill, route, payload);
                    break;
                  case 'cortex/external-api':
                    console.log('Run external-api', input.name);
                    break;
                  default:
                    console.error('Unknown runtime');
                }

                if (status.StatusCode) {
                  printError(`Invoke FAILED (${status.StatusCode}) ${status.Error || ''}`, this.options, false);
                } else {
                  printSuccess('Invoke Succeeded');
                }
              } catch (err) {
                console.error('ERROR: ', err);
              }
            }));
          }
        }));
      }));
    } else {
      console.log('No skills found');
    }
  }
};

