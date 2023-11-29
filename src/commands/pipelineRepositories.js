import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Pipelines from '../client/pipelineRepositories.js';
import {
 fileExists, printSuccess, printError, parseObject, handleTable, printExtendedLogs, handleListFailure, handleDeleteFailure, getFilteredOutput, printTable,
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
        const { message, updateReport: result, success } = response;
        if (options.json) {
          return getFilteredOutput(result, options);
        }
        if (options.inline) {
          return this.printInline(success, message, result, options);
        }
        return this.printAsTable(success, message, result, options);
      }
      return printError(response.message, options);
    } catch (err) {
      return printError(`${err.status}: ${err.message}`, options);
    }
  }

  // TODO: rename result -> updateReport
  noChangesMade(result) {
    const noChangesMade = (result.added.length === 0
      && result.deleted.length === 0
      && result.updated.length === 0
      && result.failed.add.length === 0
      && result.failed.delete.length === 0
      && result.failed.update.length === 0);
    return noChangesMade;
  }

  printAsTable(success, message, result, options) {
    if (success) {
      printSuccess(`${message}\n`, options);
    } else {
      printError(`${message}\n`, options, false); // do not exit
    }
    if (this.noChangesMade(result)) {
      return printSuccess('Pipelines up to date! No changes made.');
    }
    // Total = 105 = 15 * 3 + 20 * 3
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
    const captureFailure = (failed) => {
      // util function to format Pipeline failures
      if (failed.details) {
        return `${failed.pipelineName || ''}: ${failed.details}`;
      }
      return failed.pipelineName || '';
    };

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
        obj.failedToAdd = captureFailure(result.failed.add[i]);
      }
      if (result.failed.update[i]) {
        obj.failedToUpdate = captureFailure(result.failed.update[i]);
      }
      if (result.failed.delete[i]) {
        obj.failedToDelete = captureFailure(result.failed.delete[i]);
      }
      transformedResult.push(obj);
    }
    // The Table must include the Pipeline name and error details for Pipelines
    // that failed to be Added, Updated, Deleted. By default the Table only
    // prints the # of characters allocated for each column. To ensure all
    // details are presented set:
    //
    //  wordWrap - allows wrapping words across multiple lines in a Cell
    //  wrapOnWordBoundary - allow wrapping on any character, otherwise long
    //                strings (JSON) would be abbreviated/hidden from the user.
    //                Downside is reading messages trickier.
    const tableOptions = {
      wordWrap: true,
      // wrapOnWordBoundary: false,
    };
    return handleTable(tableSpec, transformedResult, undefined, 'Pipelines up to date! No changes made.', tableOptions);
  }

  // Alt method of printing report
  printInline(success, message, result, options) {
    function printSuccessful(title, pipelines) {
      const spec = [
        { column: 'Pipeline Name', field: 'pipelineName', width: 40 },
      ];
      if ((pipelines?.length ?? 0) > 0) {
        printSuccess(title);
        handleTable(spec, pipelines, (pipelineName) => ({ pipelineName }), { wordWrap: true });
        printSuccess(''); // add newline
      }
    }
    function printFailed(title, failedPipelines) {
      if ((failedPipelines?.length ?? 0) > 0) {
        const spec = [ // Total width: 80
          { column: 'Pipeline Name', field: 'pipelineName', width: 32 },
          { column: 'Details', field: 'details', width: 48 },
        ];
        printSuccess(title); // TODO: use printError() (without exit)??
        printTable(spec, failedPipelines, undefined, { wordWrap: true });
        printSuccess('');
      }
    }
    if (success) {
      printSuccess(`${message}\n`, options);
    } else {
      printError(`${message}\n`, options, false); // do not exit
    }
    if (this.noChangesMade(result)) {
      return printSuccess('Pipelines up to date! No changes made.');
    }
    printSuccessful('Successfully Added', result.added);
    printSuccessful('Successfully Updated', result.updated);
    printSuccessful('Successfully Deleted', result.deleted);
    printFailed('Failed to Add', result.failed.add);
    printFailed('Failed to Update', result.failed.update);
    printFailed('Failed to Delete', result.failed.delete);
    return printSuccess('');
  }

  printJson(updateReport, options) {
    return getFilteredOutput(updateReport, options);
  }
};
