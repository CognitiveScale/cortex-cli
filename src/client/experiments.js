/*
 * Copyright 2020 Cognitive Scale, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('cortex:cli');
const got = require('got');
const ProgressBar = require('progress');
const { constructError } = require('../commands/utils');

module.exports = class Experiments {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = projectId => `${cortexUrl}/fabric/projects/${projectId}/experiments`;
    }

    listExperiments(projectId, token) {
        const endpoint = `${this.endpoint(projectId)}`;
        debug('listExperiments() => %s', endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    describeExperiment(projectId, token, name) {
        const endpoint = `${this.endpoint(projectId)}/${name}`;
        debug('describeExperiment(%s) => %s', name, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    deleteExperiment(projectId, token, name) {
        const endpoint = `${this.endpoint(projectId)}/${name}`;
        debug('deleteExperiment(%s) => %s', name, endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    listRuns(projectId, token, experimentName, filter, limit, sort) {
        const endpoint = `${this.endpoint(projectId)}/${experimentName}/runs`;
        debug('listRuns(%s) => %s', experimentName, endpoint);
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
              searchParams: { query },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    describeRun(projectId, token, experimentName, runId) {
        const endpoint = `${this.endpoint(projectId)}/${experimentName}/runs/${runId}`;
        debug('describeRun(%s) => %s', runId, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    deleteRun(projectId, token, experimentName, runId) {
        const endpoint = `${this.endpoint(projectId)}/${experimentName}/runs/${runId}`;
        debug('deleteRun(%s) => %s', runId, endpoint);
        return got
            .delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));
    }

    // TODO https://www.npmjs.com/package/got#streams
    downloadArtifact(projectId, token, experimentName, runId, artifactName, showProgress = false) {
        const endpoint = `${this.endpoint(projectId)}/${experimentName}/runs/${runId}/artifacts/${artifactName}`;
        debug('downloadArtifact(%s) => %s', artifactName, endpoint);
        return got
            .get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            }).json()
            .then(result => ({ success: true, result }))
            .catch(err => constructError(err));

        const stream = request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .use((req) => {
                if (showProgress) {
                    req.on('request', (clientReq) => {
                        clientReq.on('response', (res) => {
                            const total = +(res.headers['content-length'] || res.headers['Content-Length']);
                            const progressBar = new ProgressBar(
                                '  downloading [:bar] :percent :etas',
                                {
                                    current: 0,
                                    renderThrottle: 500,
                                    total,
                                },
                            );
                        
                            res.on('data', chunk => progressBar.tick(chunk.length));
                          });
                    });
                }
            });

        return new Promise((resolve, reject) => {
            stream.on('response', (response) => {
                if (response.status !== 200) {
                    stream.abort();
                    return resolve({
                        success: false,
                        status: stream.response.status,
                        message: stream.response.error,
                    });
                }
            });

            stream.on('end', () => resolve({
                    success: true,
                    message: `\nDownloaded ${artifactName}`,
                    status: stream.response.status,
                }));

            stream.on('error', err => resolve(constructError(err)));

            stream.pipe(process.stdout);
        });
    }
};
