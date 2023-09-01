import _ from 'lodash';
import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { constructError, checkProject } from '../commands/utils.js';

const PIPELINE_API = 'pipelines';
const PIPELINE_REPO_API = 'pipeline-repositories';
const debug = debugSetup('cortex:cli');

class PipelineRepos {
  constructor(cortexUrl) {
    this.cortexUrl = cortexUrl;
    this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/${PIPELINE_REPO_API}`;
  }

  async listPipelineRepo(projectId, token, filter, limit, skip, sort) {
    checkProject(projectId);
    const endpoint = `${this.endpoint(projectId)}`;
    debug('listPipelineRepo() => %s', endpoint);
    const query = {};
    if (filter) query.filer = filter;
    if (limit) query.limit = limit;
    if (sort) query.sort = sort;
    if (skip) query.skip == skip;
    try {
      const result = await got.get(endpoint, {
        headers: defaultHeaders(token),
        searchParams: query,
      }).json();
      return ({ success: true, result });
    } catch (err) {
      return constructError(err);
    }
  }

  async savePipelineRepo(projectId, token, repoObj) {
    checkProject(projectId);
    const endpoint = `${this.endpoint(projectId)}`;
    debug('savePipelineRepo(%s) => %s', repoObj.name, endpoint);
    try {
      const message = await got.post(endpoint, {
        headers: defaultHeaders(token),
        json: repoObj,
      }).json();
      return { success: true, message };
    } catch (err) {
      return constructError(err);
    }
  }

  async describePipelineRepo(projectId, token, pipelineRepoName) {
    checkProject(projectId);
    const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(pipelineRepoName)}`;
    debug('describePipelineRepo(%s) => %s', repoObj.name, endpoint);
    try {
      const result = got.get(endpoint, {
        headers: defaultHeaders(token),
      }).json();
      return { success: true, result };
    } catch (err) {
      return constructError(err);
    }
  }

  async deletePipelineRepo(projectId, token, pipelineRepoName) {
    checkProject(projectId);
    const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(pipelineRepoName)}`;
    debug('deletePipelineRepo(%s) => %s', pipelineRepoName, endpoint);
    try {
      const result =  got.delete(endpoint, {
        headers: defaultHeaders(token),
      }).json();
      return { success: true, result };
    } catch (err) {
      return constructError(err);
    }
  }
}

export default class Pipelines {
  constructor(cortexUrl) {
    this.cortexUrl = cortexUrl;
    this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/${PIPELINE_API}`;
  }

  repos() {
    return PipelineRepos(this.cortexUrl);
  }
}
