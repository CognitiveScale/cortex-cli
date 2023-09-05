import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Pipelines from '../client/pipelines.js';
import {
 fileExists, printSuccess, printError, filterObject, parseObject, handleTable, printExtendedLogs, handleListFailure, handleDeleteFailure, getFilteredOutput,
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);

export const SavePipelineRepoCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineRepoDefinition, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeSavePipelineRepoDefinition(%s)', profile.name, pipelineRepoDefinition);
    if (!fileExists(pipelineRepoDefinition)) {
      printError(`File does not exist at: ${pipelineRepoDefinition}`);
    }

    const repoDefStr = fs.readFileSync(pipelineRepoDefinition);
    const repoObj = parseObject(repoDefStr, options);
    debug('%s', repoObj);
    const repo = new Pipelines(profile.url).repos();
    try {
      const response = repo.savePipelineRepo(options.project || profile.project, profile.token, repoObj);
      if (response.success) {
        return printSuccess('Profile Repository saved', options);
      }
      return printError(`Failed to save pipeline repository: ${response.status} ${response.message}`, options);
    } catch (err) {
      return printError(`Failed to save pipeline repository: ${err.response.body.message}`, options);
    }
  }
};

export const ListPipelineRepoCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeListPipelineRepos()', profile.name);
    const repos = new Pipelines(profile.url).repos();
    try {
      const response = await repos.listPipelineRepo(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort);
      if (response.success) {
        const result = response.pipelineRepos;
        if (options.json) {
          return getFilteredOutput(result, options);
        }
        printExtendedLogs(result, options);
        const tableSpec = [
          { column: 'Name', field: 'name', width: 20 },
          { column: 'Repo', field: 'repo', width: 35 }, // TODO: check desired length?
          { column: 'Branch', field: 'branch', width: 30 },
          { column: 'Modified', field: 'updatedAt', width: 26 },
          { column: 'Author', field: 'createdBy', width: 26 },
        ];
        return handleTable(tableSpec, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No pipeline repositories found');
      }
      return handleListFailure(response, options, 'Pipeline Repositories');
    } catch (err) {
      return printError(`Failed to list pipeline repositories: ${err.status} ${err.message}`, options);
    }
  }
};

export const DescribePipelineRepoCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineRepoName, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeDescribePipelineRepo(%s)', profile.name, pipelineRepoName);
    const repos = new Pipelines(profile.url).repos();
    try {
      const response = repos.describePipelineRepo(options.project || profile.project, profile.token, pipelineRepoName);
      if (response.success) {
        return getFilteredOutput(response.pipelineRepo, options);
      }
      return printError(`Failed to describe pipeline repository: ${response.status} ${response.message}`, options);
    } catch (err) {
      return printError(`Failed to describe pipeline repository: ${err.status} ${err.message}`, options);
    }
  }
};

export const DeletePipelineRepoCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineRepoName, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeDeleteProfileRepo(%s)', profile.name, pipelineRepoName);
    const repos = new Pipelines(profile.url).repos();
    try {
      const response = repos.deletePipelineRepo(options.project || profile.project, profile.token, pipelineRepoName);
      if (response.success) {
        const result = filterObject(response, options);
        return printSuccess(JSON.stringify(result, null, 2), options);
      }
      return handleDeleteFailure(response, options, 'Pipeline Repository');
    } catch (err) {
      return printError(`Failed to delete pipeline repository: ${err.status} ${err.message}`, options);
    }
  }
};
