/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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

const  { request } = require('../commands/apiutils');
const debug = require('debug')('cortex:cli');
const ProgressBar = require('progress');
const { constructError } = require('../commands/utils');

module.exports = class Experiments {

    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/v2/experiments`;
    }

    listExperiments(token) {
        const endpoint = `${this.endpoint}`;
        debug('listExperiments() => %s', endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeExperiment(token, name) {
        const endpoint = `${this.endpoint}/${name}`;
        debug('describeExperiment(%s) => %s', name, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    deleteExperiment(token, name) {
        const endpoint = `${this.endpoint}/${name}`;
        debug('deleteExperiment(%s) => %s', name, endpoint);
        return request
            .delete(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    listRuns(token, experimentName, filter, limit, sort) {
        const endpoint = `${this.endpoint}/${experimentName}/runs`;
        debug('listRuns(%s) => %s', experimentName, endpoint);
        const req = request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`);

        if (filter) req.query({filter});
        if (limit) req.query({limit});
        if (sort) req.query({sort});

        return req.then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    describeRun(token, experimentName, runId) {
        const endpoint = `${this.endpoint}/${experimentName}/runs/${runId}`;
        debug('describeRun(%s) => %s', runId, endpoint);
        return request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    deleteRun(token, experimentName, runId) {
        const endpoint = `${this.endpoint}/${experimentName}/runs/${runId}`;
        debug('deleteRun(%s) => %s', runId, endpoint);
        return request
            .delete(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                if (res.ok) {
                    return {success: true, result: res.body};
                }
                return {success: false, status: res.status, message: res.body};
            })
            .catch((err) => {
                return constructError(err);
            });
    }

    downloadArtifact(token, experimentName, runId, artifactName, showProgress = false) {
        const endpoint = `${this.endpoint}/${experimentName}/runs/${runId}/artifacts/${artifactName}`;
        debug('downloadArtifact(%s) => %s', artifactName, endpoint);

        const stream = request
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .use((req) => {
                if (showProgress) {
                    req.on('request', (clientReq) => {
                        clientReq.on('response', function(res) {
                            const total = +(res.headers['content-length'] || res.headers['Content-Length']);
                            const progressBar = new ProgressBar(
                                '  downloading [:bar] :percent :etas',
                                {
                                    current: 0,
                                    renderThrottle: 500,
                                    total: total,
                                }
                            );
                        
                            res.on('data', (chunk) => progressBar.tick(chunk.length));
                          });
                    });
                }
            });

        return new Promise((resolve, reject) => {
            stream.on('response', function(response) {
                if (response.status !== 200) {
                    stream.abort();
                    return resolve({
                        success: false,
                        status: stream.response.status,
                        message: stream.response.error
                    });
                }
            });

            stream.on('end', () => {
                return resolve({
                    success: true,
                    message: `\nDownloaded ${artifactName}`,
                    status: stream.response.status
                });
            });

            stream.on('error', (err) => {
                return resolve(constructError(err));
            });

            stream.pipe(process.stdout);
        });
    }
};
