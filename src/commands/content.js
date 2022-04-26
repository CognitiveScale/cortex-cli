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
const _ = require('lodash');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Content = require('../client/content');
const {
 printSuccess, printError, getSourceFiles, humanReadableFileSize, filterObject, handleTable,
} = require('./utils');

module.exports.ListContent = class ListContent {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listContent()', profile.name);

        const content = new Content(profile.url);
        content.listContent(options.project || profile.project, profile.token, options.prefix).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    const result = filterObject(response.message, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Key', field: 'Key', width: 70 },
                        { column: 'Content Type', field: 'ContentType', width: 30 },
                        { column: 'Last Modified', field: 'LastModified', width: 30 },
                        { column: 'Size (bytes)', field: 'Size', width: 20 },
                    ];

                    handleTable(tableSpec, response.message, null, 'No content found');
                }
            } else {
                printError(`Failed to list content: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list content: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.UploadContent = class UploadContent {
    constructor(program) {
        this.program = program;
    }

    async execute(contentKey, filePath, options, cbTest) {
        const profile = await loadProfile(options.profile);
        debug('%s.uploadContent()', profile.name);

        const contentClient = new Content(profile.url);

        const chunkSize = parseInt(options.chunkSize, 10);
        const upload = _.partial(UploadContent.upload, contentClient, profile, options);

        if (options.recursive) {
            getSourceFiles(filePath, (err, filesDict) => {
                if (err) {
                    debug(err);
                    printError(`Failed to upload content: ${err.status} ${err.message}`, options);
                }

                const totalBytes = filesDict.reduce((accum, current) => {
                    console.log(`${humanReadableFileSize(current.size)}\t${current.relative} -> ${contentKey}/${current.relative}`);
                    return accum + current.size;
                }, 0);
                console.log(`\nTotal:\n${humanReadableFileSize(totalBytes)}\t${filePath}`);

                debug(`chunksize ${chunkSize}`);

                if (!options.test) {
                    _.chunk(filesDict, chunkSize)
                        .reduce((promise, currentChunk) => promise
                            .then(() => {
                                debug(`working on chunk of files: ${JSON.stringify(currentChunk)}`);
                                const promises = currentChunk.map((item) => upload(`${contentKey}/${item.relative}`, item.canonical));
                                return Promise.all(promises);
                            }), Promise.resolve());
                } else {
                    console.log('Test option set. Nothing uploaded.');
                }

                if (cbTest) {
                    // for unit tests
                    cbTest(filesDict);
                }
            });
        } else {
            upload(contentKey, filePath);
        }
    }

    static upload(contentClient, profile, options, contentKey, filePath) {
        const showProgress = !!options.progress;
        const contentType = _.get(options, 'contentType', 'application/octet-stream');
        return contentClient.uploadContentStreaming(options.project || profile.project, profile.token, contentKey, filePath, showProgress, contentType).then((response) => {
            if (response.success) {
                printSuccess('Content successfully uploaded.', options);
            } else {
                printError(`Failed to upload content: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to upload content: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DeleteContent = class DeleteContent {
    constructor(program) {
        this.program = program;
    }

    async execute(contentKey, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteContent()', profile.name);

        const content = new Content(profile.url);
        content.deleteContent(options.project || profile.project, profile.token, contentKey).then((response) => {
            if (response.success) {
               printSuccess('Content successfully deleted.', options);
            } else {
                printError(`Failed to delete content: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to delete content: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DownloadContent = class DownloadContent {
    constructor(program) {
        this.program = program;
    }

    async execute(contentKey, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.DownloadContent()', profile.name);

        const content = new Content(profile.url);
        const showProgress = !!options.progress;

        content.downloadContent(options.project || profile.project, profile.token, contentKey, showProgress).catch((err) => {
                debug(err);
                printError(`Failed to download content: ${err.status} ${err.message}`, options);
        });
    }
};
