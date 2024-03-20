import debugSetup from 'debug';
import { checkProject } from '../commands/utils.js';
import { got, defaultHeaders } from './apiutils.js';
import PipelineRepos from './pipelineRepositories.js';

const PIPELINE_API = 'pipelines';
const debug = debugSetup('cortex:cli');

export default class Pipelines {
    constructor(cortexUrl) {
      this.cortexUrl = cortexUrl;
      this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/${PIPELINE_API}`;
    }
  
    listPipelines(projectId, token, filter, limit, skip, sort) {
      checkProject(projectId);
      const endpoint = this.endpointV4(projectId);
      debug('listPipelines() => %s', endpoint);
      const query = {};
      if (filter) query.filter = filter;
      if (limit) query.limit = limit;
      if (sort) query.sort = sort;
      if (skip) query.skip = skip;
      return got.get(endpoint, {
        headers: defaultHeaders(token),
        searchParams: query,
      }).json();
    }

    describePipeline(projectId, token, name, gitRepoName, sha) {
      checkProject(projectId);
      const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(name)}`;
      debug('describePipeline(%s, %s) => %s', name, gitRepoName, endpoint);
      const searchParams = { gitRepoName };
      if (sha) {
        searchParams.sha = sha;
      }
        return got.get(endpoint, {
          headers: defaultHeaders(token),
          searchParams: { ...searchParams },
        }).json();
    }

    runPipeline(projectId, token, name, gitRepoName, params, options) {
      checkProject(projectId);
      const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(name)}/run`;
      debug('runPipeline(%s, %s) => %s', name, gitRepoName, endpoint);
      const { commit, block } = options;
      const query = { };
      if (options?.scheduleName) {
        query.scheduleName = options.scheduleName;
      }
      if (options?.scheduleCron) {
        query.scheduleCron = options.scheduleCron;
      }

      const body = { gitRepoName, ...params };
      if (commit) {
        body.commit = commit;
      }
      if (block) {
        body.block = block;
      }
        return got.post(endpoint, {
          headers: defaultHeaders(token),
          json: body,
          searchParams: query,
        }).json();
    }

    describePipelineRun(projectId, token, runId) {
      checkProject(projectId);
      const endpoint = `${this.endpointV4(projectId)}/run/${runId}`;
      debug('describePipeline(%s) => %s', runId, endpoint);
        return got.get(endpoint, {
          headers: defaultHeaders(token),
        }).json();
    }

    listPipelineRuns(projectId, token, name, gitRepoName, limit, skip, sort, filter) {
      checkProject(projectId);
      const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(name)}/run`;
      debug('listPipelineRuns(%s, %s) => %s', name, gitRepoName, endpoint);
      const query = { gitRepoName };
      if (filter) query.filter = filter;
      if (limit) query.limit = limit;
      if (sort) query.sort = sort;
      if (skip) query.skip = skip;
      return got.get(endpoint, {
        headers: defaultHeaders(token),
        searchParams: query,
      }).json();
    }

    repos() {
      return new PipelineRepos(this.cortexUrl);
    }
  }
