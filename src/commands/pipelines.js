import debugSetup from 'debug';
import fs from 'fs';
import dayjs from 'dayjs';
import _ from 'lodash';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Pipelines from '../client/pipelines.js';
import { 
    printError,
    handleTable,
    printExtendedLogs,
    handleListFailure,
    handleDeleteFailure,
    getFilteredOutput,
    parseObject,
    filterObject,
    getQueryOptions,
    printSuccess,
    printTable,
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);



export const ListPipelineCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeListPipelines()', profile.name);
    const pipelines = new Pipelines(profile.url);
    try {
        const response = await pipelines.listPipelines(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort);
      if (response.success) {
        const result = response.pipelines;
        if (options.json) {
          return getFilteredOutput(result, options);
        }
        printExtendedLogs(result, options);
        const tableSpec = [
          { column: 'Name', field: 'name', width: 20 },
          { column: 'Git Repo Name', field: 'gitRepoName', width: 20 },
          { column: 'SHA', field: 'sha', width: 20 },
          { column: 'Modified', field: 'updatedAt', width: 22 },
          { column: 'Author', field: 'createdBy', width: 22 },
        ];
        return handleTable(tableSpec, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No pipelines found');
      }
      return handleListFailure(response, options, 'Pipelines');
    } catch (err) {
      return printError(`Failed to list pipelines: ${err.status} ${err.message}`, options);
    }
  }
};

export const DescribePipelineCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineName, gitRepoName, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeDescribePipeline(%s, %s)', profile.name, pipelineName, gitRepoName);
    const pipelines = new Pipelines(profile.url);
    try {
      const response = await pipelines.describePipeline(options.project || profile.project, profile.token, pipelineName, gitRepoName, options.sha);
      if (response.success) {
        return getFilteredOutput(response.pipeline, options);
      }
      return printError(`Failed to describe pipeline: ${response.status} ${response.message}`, options);
    } catch (err) {
      return printError(`Failed to describe pipeline: ${err.status} ${err.message}`, options);
    }
  }
};

export const RunPipelineCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineName, gitRepoName, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeRunPipeline(%s)', profile.name, pipelineName);
    let params = {};
    if (options.params) {
        try {
            params = parseObject(options.params, options);
        } catch (e) {
            printError(`Failed to parse params: ${options.params} Error: ${e}`, options);
        }
    } else if (options.paramsFile) {
        if (!fs.existsSync(options.paramsFile)) {
            printError(`File does not exist at: ${options.paramsFile}`);
        }
        const paramsStr = fs.readFileSync(options.paramsFile);
        params = parseObject(paramsStr, options);
    }
    const pipelines = new Pipelines(profile.url);
    try {
      const response = await pipelines.runPipeline(options.project || profile.project, profile.token, pipelineName, gitRepoName, params, options);
      if (response.success) {
        return getFilteredOutput(response, options);
      }
      return printError(`Failed to run pipeline: ${response.status} ${response.message}`, options);
    } catch (err) {
      return printError(`Failed to run pipeline: ${err.status} ${err.message}`, options);
    }
  }
};

export const DescribePipelineRunCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(runId, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeDescribePipelineRun(%s)', profile.name, runId);
    const pipelines = new Pipelines(profile.url);
    try {
      const response = await pipelines.describePipelineRun(options.project || profile.project, profile.token, runId);
      if (response.success) {
        if (options.report && !options.json) {
            const result = filterObject(response, getQueryOptions(options));
            const tableSpec = [
                { column: 'Name', field: 'name', width: 40 },
                { column: 'Title', field: 'title', width: 40 },
                { column: 'Type', field: 'type', width: 20 },
                { column: 'Status', field: 'status', width: 20 },
                { column: 'Elapsed (ms)', field: 'elapsed', width: 30 },
            ];
            printSuccess(`Status: ${_.get(result, 'status')}`);
            printSuccess(`Elapsed Time (ms): ${_.get(result, 'elapsed')}`);
            printTable(tableSpec, _.sortBy(_.get(result, 'transits'), ['start', 'end']));
        } else {
            getFilteredOutput(response, options);
        }
      } else {
        printError(`Failed to desribe pipeline run ${runId}: ${response.message}`, options);
      }
    } catch (err) {
      printError(`Failed to describe pipeline run ${runId}: ${err.status} ${err.message}`, options);
    }
  }
};
export const DeletePipelineCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineName, gitRepoName, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeDeletePipeline(%s)', profile.name, pipelineName,gitRepoName);
    const repos = new Pipelines(profile.url);
    try {
      const response = await repos.deletePipeline(options.project || profile.project, profile.token, pipelineName,gitRepoName );
      if (response.success) {
        return printSuccess(response?.message ?? response, options);
      }
      return handleDeleteFailure(response, options, 'Pipeline');
    } catch (err) {
      return printError(`Failed to delete pipeline: ${err.status} ${err.message}`, options);
    }
  }
};

export const ListPipelineRunsCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineName, gitRepoName, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeListPipelineRuns(%s, %s)', profile.name, pipelineName);
    const pipelines = new Pipelines(profile.url);
    try {
      const response = await pipelines.listPipelineRuns(options.project || profile.project, profile.token, pipelineName, gitRepoName);
      if (response.success) {
        const result = response.activations;
        // TODO remove --query on deprecation
        if (options.json || options.query) {
          return getFilteredOutput(result, options);
        }
        printExtendedLogs(result, options);
        const tableSpec = [
            { column: 'Name', field: 'name', width: 30 },
            { column: 'Run Id', field: 'activationId', width: 40 },
            { column: 'Status', field: 'status', width: 20 },
            { column: 'Started', field: 'start', width: 65 },
        ];
        const genName = (o) => {
            if (o.agentName) {
                return `${o.agentName} (Agent)`;
            }
            if (o.skillName) {
                return `${o.skillName} (Skill)`;
            }
            return '-';
        };
        return handleTable(tableSpec, _.map(result, (o) => ({
            ...o,
            name: genName(o),
            start: o.start ? dayjs(o.start).fromNow() : '-',
        })), null, 'No pipeline runs found');
    }
    return handleListFailure(response, options, 'PipelineRuns');
    } catch (err) {
      return printError(`Failed to list pipelne runs: ${err.status} ${err.message}`, options);
    }
  }
};
