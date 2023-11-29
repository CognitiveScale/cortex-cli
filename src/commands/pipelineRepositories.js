import fs from 'node:fs';
import chalk from 'chalk';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Pipelines from '../client/pipelineRepositories.js';
import {
 fileExists, printSuccess, printError, parseObject, handleTable, printExtendedLogs, handleListFailure, handleDeleteFailure, getFilteredOutput, printTable, printCrossTable, useColor
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
        if (options.inline) {
          return this.printInline(success, message, updateReport, options);
        }
        return this.printAsTable(success, message, updateReport, options);
      }
      return printError(response.message, options);
    } catch (err) {
      return printError(`${err.status}: ${err.message}`, options);
    }
  }

  noChangesMade(updateReport) {
    const noChangesMade = (updateReport.added.length === 0
      && updateReport.deleted.length === 0
      && updateReport.updated.length === 0
      && updateReport.failed.add.length === 0
      && updateReport.failed.delete.length === 0
      && updateReport.failed.update.length === 0);
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
    function toTableValue(title, pipelines) {
      // Add a cell to the table with a Title describing the type of change.
      // The Title spans the # of corresponding Pipelines - always at least 1.
      const titleRowSpan = (pipelines?.length || 1);
      const coloredTitle = useColor(options) ? chalk.cyan(title) : title; // optionally add color
      const values = [
        [
          {
            rowSpan: titleRowSpan, content: coloredTitle, vAlign: 'center', hAlign: 'center',
          },
        ],
      ];
      // Add rows corresponding to Pipelines
      const rows = pipelines.map((p) => [p.pipelineName || '-', p.details || '-']); // default values to '-'
      if (rows.length === 0) {
        // No records to show, thus default 1 row w/ aligned with Title Cell
        rows.push('-', '-');
        values[0].push(...rows);
      } else {
        // Include an initial row lining up with the Title Cell, then add all
        // other rows below that to fill out the section
        values[0].push(...rows.shift());
        values.push(...rows);
      }
      return values;
    }
    const tableSpec = [
      { column: '', width: 25 },
      { column: 'Pipeline Name', width: 25 },
      { column: 'Details', width: 30 },
    ];
    const tableValues = [];
    tableValues.push(
      ...toTableValue('Added', updateReport.added.map((pipelineName) => ({ pipelineName, details: '' }))),
      ...toTableValue('Updated', updateReport.updated.map((pipelineName) => ({ pipelineName, details: '' }))),
      ...toTableValue('Deleted', updateReport.deleted.map((pipelineName) => ({ pipelineName, details: '' }))),
      ...toTableValue('Failed to Add', updateReport.failed.add),
      ...toTableValue('Failed to Update', updateReport.failed.update),
      ...toTableValue('Failed to Delete', updateReport.failed.delete),
    );
    debug(`Constructed Table with values: ${JSON.stringify(tableValues)}`);
    // The Table must include the Pipeline name and error details for Pipelines
    // that failed to be Added, Updated, Deleted. By default the Table only
    // prints the # of characters allocated for each column. To ensure all
    // details are presented set 'wordWrap' to True.
    return printCrossTable(tableSpec, tableValues, { wordWrap: true });
  }

  // Alt method of printing report
  printInline(success, message, updateReport, options) {
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
    printSuccessful('Successfully Added', updateReport.added);
    printSuccessful('Successfully Updated', updateReport.updated);
    printSuccessful('Successfully Deleted', updateReport.deleted);
    printFailed('Failed to Add', updateReport.failed.add);
    printFailed('Failed to Update', updateReport.failed.update);
    printFailed('Failed to Delete', updateReport.failed.delete);
    return printSuccess('');
  }

  printJson(updateReport, options) {
    return getFilteredOutput(updateReport, options);
  }
};
