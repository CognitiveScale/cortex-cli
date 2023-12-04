import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { constructError, checkProject } from '../commands/utils.js';

const PIPELINE_REPO_API = 'pipeline-repositories';
const debug = debugSetup('cortex:cli');

export default class PipelineRepos {
  constructor(cortexUrl) {
    this.cortexUrl = cortexUrl;
    this.endpoint = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/${PIPELINE_REPO_API}`;
  }

  async listPipelineRepo(projectId, token, filter, limit, skip, sort) {
    checkProject(projectId);
    const endpoint = `${this.endpoint(projectId)}`;
    debug('listPipelineRepo() => %s', endpoint);
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

  async savePipelineRepo(projectId, token, repoObj) {
    checkProject(projectId);
    const endpoint = `${this.endpoint(projectId)}`;
    debug('savePipelineRepo(%s) => %s', repoObj.name, endpoint);
    try {
      return await got.post(endpoint, {
        headers: defaultHeaders(token),
        json: repoObj,
      }).json();
    } catch (err) {
      return constructError(err);
    }
  }

  async describePipelineRepo(projectId, token, pipelineRepoName) {
    checkProject(projectId);
    const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(pipelineRepoName)}`;
    debug('describePipelineRepo(%s) => %s', pipelineRepoName, endpoint);
    try {
      return await got.get(endpoint, {
        headers: defaultHeaders(token),
      }).json();
    } catch (err) {
      return constructError(err);
    }
  }

  async deletePipelineRepo(projectId, token, pipelineRepoName) {
    checkProject(projectId);
    const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(pipelineRepoName)}`;
    debug('deletePipelineRepo(%s) => %s', pipelineRepoName, endpoint);
    try {
      return await got.delete(endpoint, {
        headers: defaultHeaders(token),
      }).json();
    } catch (err) {
      return constructError(err);
    }
  }

  async updateRepoPipelines(projectId, token, pipelineRepoName, skill) {
    checkProject(projectId);
    const params = {};
    const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(pipelineRepoName)}/update`;
    if (skill) {
      params.skillName = skill;
    }
    debug('updateRepoPipelines(%s) => %s', pipelineRepoName, endpoint);
    try {
      return await got.post(endpoint, {
        headers: defaultHeaders(token),
        searchParams: params,
      }).json();
    } catch (err) {
      return constructError(err);
    }
  }
}
