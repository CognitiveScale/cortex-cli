import debugSetup from 'debug';
import { constructError, checkProject } from '../commands/utils.js';
import { got, defaultHeaders } from './apiutils.js';
import PipelineRepos from './pipelineRepositories.js';

const PIPELINE_API = 'pipelines';
const debug = debugSetup('cortex:cli');

export default class Pipelines {
    constructor(cortexUrl) {
      this.cortexUrl = cortexUrl;
      this.endpointV4 = (projectId) => `http://localhost:4445/fabric/v4/projects/${projectId}/${PIPELINE_API}`;
    }
  
    async listPipelines(projectId, token, filter, limit, skip, sort) {
      checkProject(projectId);
      const endpoint = this.endpointV4(projectId);
      debug('listPipelines() => %s', endpoint);
      const query = {};
      if (filter) query.filer = filter;
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

    async describePipeline(projectId, token, name) {
      checkProject(projectId);
      const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(name)}`;
      debug('describePipeline(%s) => %s', name, endpoint);
      try {
        return await got.get(endpoint, {
          headers: defaultHeaders(token),
        }).json();
      } catch (err) {
        return constructError(err);
      }
    }

    repos() {
      return new PipelineRepos(this.cortexUrl);
    }
  }
