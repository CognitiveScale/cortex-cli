import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Pipelines from '../client/pipelineRepositories.js';
import {
 fileExists, printSuccess, printError, parseObject, handleTable, printExtendedLogs, handleListFailure, handleDeleteFailure, getFilteredOutput, printCrossTable,
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
    let repoObj = {};
    if (pipelineRepoDefinition && !fileExists(pipelineRepoDefinition)) {
      printError(`File does not exist at: ${pipelineRepoDefinition}`);
    } else if (pipelineRepoDefinition) {
      const repoDefStr = fs.readFileSync(pipelineRepoDefinition);
      repoObj = parseObject(repoDefStr, options);
    }
    debug('%s', repoObj);

    // Take options as overrides if both are provided..
    if (options?.name) { repoObj.name = options.name; }
    if (options?.repo) { repoObj.repo = options.repo; }
    if (options?.branch) { repoObj.branch = options.branch; }

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
      // Check for 'updateReport' property
      if (response.updateReport) {
        const { message, updateReport, success } = response;
        if (options.json) {
          return getFilteredOutput(updateReport, options);
        }
        return this.printAsTable(success, message, updateReport, options);
      }
      return printError(response.message, options);
    } catch (err) {
      return printError(`${err.status}: ${err.message}`, options);
    }
  }

  noChangesMade(updateReport) {
    const noChangesMade = (updateReport?.added?.length === 0
      && updateReport?.deleted?.length === 0
      && updateReport?.updated?.length === 0
      && updateReport?.failed?.add?.length === 0
      && updateReport?.failed?.delete?.length === 0
      && updateReport?.failed?.update?.length === 0);
    return noChangesMade;
  }

  printAsTable(success, message, updateReport, options) {
    if (success && this.noChangesMade(updateReport)) {
      // no changes made -> no need to show update report
      return printSuccess('Pipelines up to date! No changes made.', options);
    }
    // Top level message
    if (success) {
      printSuccess(`${message}\n`, options);
    } else {
      printError(`${message}\n`, options, false); // do not exit
    }
    // Constructs a crossed-table (i.e. nested table) with the left most column
    // identifying the Type of Change (e.g. Added, Deleted) followed by columns
    // 'Pipeline Name' & 'Details'.
    const tableSpec = [
      { column: '', width: 20 }, // explicit width to keep table reasonable length
      { column: 'Pipeline Name', width: 25, field: 'pipelineName' },
      { column: 'Details', width: 30, field: 'details' },
    ];
    const tableSections = {
      Added: updateReport.added.map((pipelineName) => ({ pipelineName, details: '' })),
      Updated: updateReport.updated.map((pipelineName) => ({ pipelineName, details: '' })),
      Deleted: updateReport.deleted.map((pipelineName) => ({ pipelineName, details: '' })),
      'Failed to Add': updateReport.failed.add,
      'Failed to Update': updateReport.failed.update,
      'Failed to Delete': updateReport.failed.delete,
    };
    debug('Constructed Table with values: %s, columns: %s', JSON.stringify(tableSections), JSON.stringify(tableSpec));
    // The Table must include the Pipeline name and error details for Pipelines
    // that failed to be Added, Updated, Deleted. By default the Table only
    // prints the # of characters allocated for each column. To ensure all
    // details are presented set 'wordWrap' to True.
    return printCrossTable(tableSpec, tableSections, { wordWrap: true });
  }

  printJson(updateReport, options) {
    return getFilteredOutput(updateReport, options);
  }
};
