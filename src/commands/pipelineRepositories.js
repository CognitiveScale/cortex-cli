import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Pipelines from '../client/pipelineRepositories.js';
import {
 fileExists, printSuccess, printError, parseObject, handleTable, printExtendedLogs, handleListFailure, handleDeleteFailure, getFilteredOutput,
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
    const repo = new Pipelines(profile.url);
    try {
      const response = await repo.savePipelineRepo(options.project || profile.project, profile.token, repoObj);
      if (response.success) {
        return printSuccess('Pipeline Repository saved', options);
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
    const repos = new Pipelines(profile.url);
    try {
      const response = await repos.listPipelineRepo(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort);
      if (response.success) {
        const result = response.pipelineRepositories;
        if (options.json) {
          return getFilteredOutput(result, options);
        }
        printExtendedLogs(result, options);
        const tableSpec = [
          { column: 'Name', field: 'name', width: 20 },
          { column: 'Repo', field: 'repo', width: 40 },
          { column: 'Branch', field: 'branch', width: 15 },
          { column: 'Modified', field: 'updatedAt', width: 22 },
          { column: 'Author', field: 'createdBy', width: 22 },
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
    const repos = new Pipelines(profile.url);
    try {
      const response = await repos.describePipelineRepo(options.project || profile.project, profile.token, pipelineRepoName);
      if (response.success) {
        return getFilteredOutput(response.pipelineRepository, options);
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
    const repos = new Pipelines(profile.url);
    try {
      const response = await repos.deletePipelineRepo(options.project || profile.project, profile.token, pipelineRepoName);
      if (response.success) {
        return printSuccess(response?.message ?? response, options);
      }
      return handleDeleteFailure(response, options, 'Pipeline Repository');
    } catch (err) {
      return printError(`Failed to delete pipeline repository: ${err.status} ${err.message}`, options);
    }
  }
};

export const UpdateRepoPipelinesCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineRepoName, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeUpdateRepoPipelines(%s)', profile.name, pipelineRepoName);
    const repos = new Pipelines(profile.url);
    try {
      const response = await repos.updateRepoPipelines(options.project || profile.project, profile.token, pipelineRepoName, options.skill);
      if (response.success) {
        const result = response.updateReport;
        if (options.json) {
          return getFilteredOutput(result, options);
        }
        const tableSpec = [
          { column: 'Added', field: 'added', width: 15 },
          { column: 'Updated', field: 'updated', width: 15 },
          { column: 'Deleted', field: 'deleted', width: 15 },
          { column: 'Failed to Add', field: 'failedToAdd', width: 20 },
          { column: 'Failed to Update', field: 'failedToUpdate', width: 20 },
          { column: 'Failed to Delete', field: 'failedToDelete', width: 20 },
        ];
        const maxLength = Math.max(
          result.added.length,
          result.updated.length,
          result.deleted.length,
          result.failed.add.length,
          result.failed.delete.length,
          result.failed.update.length,
        );
        const transformedResult = [];
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < maxLength; i++) {
          const obj = {};

          if (result.added[i]) {
            obj.added = result.added[i];
          }
          if (result.updated[i]) {
            obj.updated = result.updated[i];
          }
          if (result.deleted[i]) {
            obj.deleted = result.deleted[i];
          }
          if (result.failed.add[i]) {
            obj.failedAdd = result.failed.add[i].pipelineName || '';
          }
          if (result.failed.update[i]) {
            obj.failedUpdate = result.failed.update[i].pipelineName || '';
          }
          if (result.failed.delete[i]) {
            obj.failedDelete = result.failed.delete[i].pipelineName || '';
          }
          transformedResult.push(obj);
        }
        return handleTable(tableSpec, transformedResult, (o) => ({
          added: o.added,
          updated: o.updated,
          deleted: o.deleted,
          failedToAdd: o.failedAdd,
          failedToUpdate: o.failedUpdate,
          failedToDelete: o.failedDelete,
        }), 'Failed to update repo pipelines');
      }
      return printError(`Failed to update repo pipelines: ${response.status} ${response.message}`, options);
    } catch (err) {
      return printError(`Failed to update repo pipelines: ${err.status} ${err.message}`, options);
    }
  }
};
