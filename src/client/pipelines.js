import debugSetup from 'debug';
import { constructError, checkProject } from '../commands/utils.js';
import { got, defaultHeaders } from './apiutils.js';
import PipelineRepos from './pipelineRepositories.js';

const PIPELINE_API = 'pipelines';
const debug = debugSetup('cortex:cli');

export default class Pipelines {
    constructor(cortexUrl) {
      this.cortexUrl = cortexUrl;
      this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/${PIPELINE_API}`;
    }
  
    async listPipelines(projectId, token, filter, limit, skip, sort) {
      checkProject(projectId);
      const endpoint = this.endpointV4(projectId);
      debug('listPipelines() => %s', endpoint);
      const query = {};
      if (filter) query.filter = filter;
      if (limit) query.limit = limit;
      if (sort) query.sort = sort;
      if (skip) query.skip = skip;
      try {
        return await got.get(endpoint, {
          headers: defaultHeaders(token),
          searchParams: query,
        }).json();
      } catch (err) {
        return constructError(err);
      }
    }

    async describePipeline(projectId, token, name, gitRepoName) {
      checkProject(projectId);
      const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(name)}`;
      debug('describePipeline(%s, %s) => %s', name, gitRepoName, endpoint);
      try {
        return await got.get(endpoint, {
          headers: defaultHeaders(token),
          searchParams: { gitRepoName },
        }).json();
      } catch (err) {
        return constructError(err);
      }
    }

    async runPipeline(projectId, token, name, gitRepoName, params) {
      checkProject(projectId);
      const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(name)}/run`;
      debug('runPipeline(%s) => %s', name, endpoint);
      try {
        return await got.post(endpoint, {
          headers: defaultHeaders(token),
          json: { gitRepoName, ...params },
        }).json();
      } catch (err) {
        return constructError(err);
      }
    }

    async describePipelineRun(projectId, token, name, runId) {

    }

    async listPipelineRuns(projectId, token, name) {

    }

    repos() {
      return new PipelineRepos(this.cortexUrl);
    }
  }
