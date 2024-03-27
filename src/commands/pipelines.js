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
    getFilteredOutput,
    parseObject,
    filterObject,
    getQueryOptions,
    printSuccess,
    printTable,
    printWarning,
} from './utils.js';
import { TemplateConfigureCommand } from './workspaces/configure.js';
import { TemplateGenerationCommand } from './workspaces/generate.js';


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
      const filteringByRepo = options.repo && !options.filter;
      const filter = filteringByRepo ? JSON.stringify({ gitRepoName: options.repo }) : options.filter;
      if (options.repo && options.filter) {
        printWarning('WARNING: --repo and --filter options are incompatible! The --filter option will be used', options);
      }
      const response = await pipelines.listPipelines(options.project || profile.project, profile.token, filter, options.limit, options.skip, options.sort);
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
        printError(`Failed to parse params: ${options.params}. Error: ${e}`, options);
      }
    } else if (options.paramsFile) {
      if (!fs.existsSync(options.paramsFile)) {
        printError(`File does not exist at: ${options.paramsFile}`, options);
      }
      const paramsStr = fs.readFileSync(options.paramsFile);
      params = parseObject(paramsStr, options);
    }
    const pipelines = new Pipelines(profile.url);
    try {
      const response = await pipelines.runPipeline(options.project || profile.project, profile.token, pipelineName, gitRepoName, params, options);
      if (!response.success) {
        printError(`Failed to run pipeline: ${response.status} ${response.message}`, options);
        return;
      }

      // Prefer 'runId' but support 'activationId' as a fallback
      if (response?.activationId) {
        response.runId = response?.runId || response?.activationId;
        delete response.activationId;
      }

      if (options.json) {
        getFilteredOutput(response, options);
      } else if (response?.runId) {
        printSuccess(`Pipeline Run Submitted!\n\nUse "cortex pipelines describe-run ${response.runId}" to inspect the Pipeline Run`);
      } else if (response?.message) {
        // Print the message from server - expected when a Pipeline is scheduled
        printSuccess(response.message);
      }
    } catch (err) {
      printError(`Failed to run pipeline: ${err.status} ${err.message}`, options);
    }
  }
};

export const DescribePipelineRunCommand = class {
  constructor(program) {
    this.program = program;
  }

  getStateMatchingTransit(transit, states) {
    const hasMatchingEndpoints = (s) => s?.from === transit?.from && s?.to === transit?.to;
    return (states ?? []).find(hasMatchingEndpoints);
  }

  extractBlocksFromRun(pipelineRun) {
    // NOTE: 'plan.states' & 'transits' should be equivalent, so try
    // extracting details of the Pipeline run from the corresponding
    // 'state'. Only consider Blocks to avoid confusion from input/output.
    //
    // TODO:: states & transits aren't necessarily equivalent when running an
    // single Block in a Pipeline. However, BUG https://cognitivescale.atlassian.net/browse/FAB-6294
    // makes it so the entire Pipeline is run. Once that is resolved, the CLI
    // can be configured to accurately print the plan.
    const blocks = pipelineRun?.transits?.map((t) => {
      const state = this.getStateMatchingTransit(t, pipelineRun?.plan?.states);
      // Skills are equivalent to Blocks, so it's clearer to rename the
      // type. Plus extra Block metadata can be found in the Properties.
      if (state?.type === 'skill') {
        const props = state?.ref?.properties || [];
        const blockProp = props.find((p) => p?.name === 'block');
        const typeProp = props.find((p) => p?.name === 'type');
        return {
          type: typeProp?.value || '-', // i.e. block-type
          start: t.start,
          end: t.end,
          status: t.status,
          elapsed: t.end ? dayjs(t.end).diff(dayjs(t.start)) : 'N/A',
          title: state?.ref?.title || t.title,
          name: blockProp?.value || t.name,
        };
      }
      return undefined;
    }).filter((x) => x); // filter undefined
    return blocks;
  }

  async execute(runId, options) {
    const profile = await loadProfile(options.profile);
    debug('%s.executeDescribePipelineRun(%s)', profile.name, runId);
    const pipelines = new Pipelines(profile.url);
    try {
      const response = await pipelines.describePipelineRun(options.project || profile.project, profile.token, runId);
      if (response.success) {
        if (options.json) {
          getFilteredOutput(response, options);
        } else {
          // Print table view of Pipeline Run
          const result = filterObject(response, getQueryOptions(options));
          const tableSpec = [
            { column: 'Block Name', field: 'name', width: 40 },
            { column: 'Block Title', field: 'title', width: 40 },
            { column: 'Type', field: 'type', width: 20 },
            { column: 'Status', field: 'status', width: 20 },
            { column: 'Elapsed Time (ms)', field: 'elapsed', width: 30 },
          ];
          const blocks = this.extractBlocksFromRun(result);
          const elapsed = result?.end ? dayjs(result.end).diff(dayjs(result.start)) : 'N/A';
          const logsAvailable = Object.prototype.hasOwnProperty.call(result, 'response') ? 'Yes' : 'No';
          printSuccess(`Status: ${result?.status}`);
          printSuccess(`Elapsed Time (ms): ${elapsed}`);
          printSuccess(`Logs Available: ${logsAvailable}`);
          printSuccess('Details:');
          printTable(tableSpec, _.sortBy(blocks, ['start', 'end']));
        }
      } else {
        printError(`Failed to desribe pipeline run ${runId}: ${response.message}`, options);
      }
    } catch (err) {
      printError(`Failed to describe pipeline run ${runId}: ${err.status} ${err.message}`, options);
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
      const response = await pipelines.listPipelineRuns(options.project || profile.project,
        profile.token, pipelineName, gitRepoName, options.limit, options.skip, options.sort, options.filter);
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

// NOTE: Easiest way to piggy-back of the existing functionality from Workspaces is to
// directly use the same logic via inheritance.
//
// The constructor assigns a different configKey to avoid collision from sharing the
// same property in the config file.
export const PipelineTemplateConfigureCommand = class extends TemplateConfigureCommand {
  constructor(program) {
    super(program, 'pipelineTemplateConfig', 'Pipelines');
  }
};

export const PipelineGenerateCommand = class extends TemplateGenerationCommand {
  constructor(program) {
    super(program, 'Pipeline', 'pipelines', 'pipelinename', 'pipelineTemplateConfig');
  }

  async configureSubcommand() {
    await (new PipelineTemplateConfigureCommand(this.program)).execute({ refresh: true });
  }
};
