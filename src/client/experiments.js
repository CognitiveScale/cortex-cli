import fs from 'node:fs';
import pipeline from 'node:stream/promises';
import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { constructError, checkProject } from '../commands/utils.js';
import Content from './content.js';

const debug = debugSetup('cortex:cli');
export default (class Experiments {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/experiments`;
    }

    listExperiments(projectId, modelId, token, filter, limit, skip, sort) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}?${modelId ? `modelId=${modelId}` : ''}`;
        debug('listExperiments() => %s', endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    describeExperiment(projectId, token, name) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(name)}`;
        debug('describeExperiment(%s) => %s', name, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    deleteExperiment(projectId, token, name) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(name)}`;
        debug('deleteExperiment(%s) => %s', name, endpoint);
        return got
            .delete(endpoint, {
            headers: defaultHeaders(token),
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    listRuns(projectId, token, experimentName, filter, limit, sort, skip) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(experimentName)}/runs`;
        debug('listRuns(%s) => %s', experimentName, endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    describeRun(projectId, token, experimentName, runId) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(experimentName)}/runs/${runId}`;
        debug('describeRun(%s) => %s', runId, endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    deleteRun(projectId, token, experimentName, runId) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(experimentName)}/runs/${runId}`;
        debug('deleteRun(%s, %s) => %s', experimentName, runId, endpoint);
        return got
            .delete(endpoint, {
            headers: defaultHeaders(token),
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    _artifactKey(experimentName, runId, artifact) {
        return `experiments/${experimentName}/${runId}/artifacts/${artifact}`;
    }

    // eslint-disable-next-line no-unused-vars
    async downloadArtifact(projectId, token, experimentName, runId, artifactName, showProgress = false) {
        checkProject(projectId);
        try {
            // Check if run exists..
            await this.describeRun(projectId, token, experimentName, runId);
            // just generate the key and avoid hop to managed content..
            const key = this._artifactKey(experimentName, runId, artifactName);
            const cont = new Content(this.cortexUrl);
            return cont.downloadContent(projectId, token, key, showProgress);
        } catch (err) {
            return constructError(err);
        }
    }

    saveExperiment(projectId, token, experimentObj) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}`;
        debug('saveExperiment(%s) => %s', experimentObj.name, endpoint);
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: experimentObj,
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    createRun(projectId, token, runObj) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(runObj.experimentName)}/runs`;
        debug('createRun(%s) => %s', runObj.experimentName, endpoint);
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: runObj,
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    updateRun(projectId, token, runObj) {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(runObj.experimentName)}/runs/${runObj.runId}`;
        debug('updateRun(%s) => %s', runObj.experimentName, endpoint);
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: runObj,
        }).json()
            .then((result) => ({ success: true, result }))
            .catch((err) => constructError(err));
    }

    async uploadArtifact(projectId, token, experimentName, runId, content, artifact, contentType = 'application/octet-stream') {
        checkProject(projectId);
        const endpoint = `${this.endpoint(projectId)}/${encodeURIComponent(experimentName)}/runs/${encodeURIComponent(runId)}/artifacts/${artifact}`;
        debug('uploadArtifact(%s, %s) => %s', artifact, content, endpoint);
        try {
            const message = await pipeline(fs.createReadStream(content), got.stream.put(endpoint, {
                headers: defaultHeaders(token, { 'Content-Type': contentType }),
            }));
            return { success: true, message };
        } catch (err) {
            return constructError(err);
        }
    }
});
