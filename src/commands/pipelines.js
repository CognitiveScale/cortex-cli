import debugSetup from 'debug';
import fs from 'fs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Pipelines from '../client/pipelines.js';
import { 
    printError,
    handleTable,
    printExtendedLogs,
    handleListFailure,
    getFilteredOutput,
    parseObject,
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
      const response = await pipelines.describePipeline(options.project || profile.project, profile.token, pipelineName, gitRepoName);
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
      const response = await pipelines.runPipeline(options.project || profile.project, profile.token, pipelineName, gitRepoName, params);
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

  async execute(pipelineName, runId, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeRunPipeline(%s, %s)', profile.name, pipelineName, runId);
    const pipelines = new Pipelines(profile.url);
    try {
      const response = await pipelines.describePipelineRun(options.project || profile.project, profile.token, pipelineName, runId);
      if (response.success) {
        return getFilteredOutput(response.pipeline, options);
      }
      return printError(`Failed to describe pipeline run: ${response.status} ${response.message}`, options);
    } catch (err) {
      return printError(`Failed to describe pipeline run: ${err.status} ${err.message}`, options);
    }
  }
};

export const ListPipelineRunsCommand = class {
  constructor(program) {
    this.program = program;
  }

  async execute(pipelineName, runId, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeListPipelineRuns(%s, %s)', profile.name, pipelineName, runId);
    const pipelines = new Pipelines(profile.url);
    try {
      const response = await pipelines.listPipelineRuns(options.project || profile.project, profile.token, pipelineName);
      if (response.success) {
        return getFilteredOutput(response.pipeline, options);
      }
      return printError(`Failed to list pipeline runs: ${response.status} ${response.message}`, options);
    } catch (err) {
      return printError(`Failed to list pipeline runs: ${err.status} ${err.message}`, options);
    }
  }
};