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

const fs = require('fs');
const path = require('path');
const yeoman = require('yeoman-environment');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Content = require('../client/content');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

module.exports.ListContent = class ListContent {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.listContent()', profile.name);

        const content = new Content(profile.url);
        content.listContent(profile.token).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    let result = filterObject(response.message, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    let tableSpec = [
                        { column: 'Key', field: 'Key', width: 70 },
                        { column: 'Content Type', field: 'ContentType', width: 30 },
                        { column: 'Last Modified', field: 'LastModified', width: 30 },
                        { column: 'Size (bytes)', field: 'Size', width: 20 }
                    ];

                    printTable(tableSpec, response.message);
                }
            }
            else {
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

    execute(contentKey, filePath, options) {
        const profile = loadProfile(options.profile);
        debug('%s.listContent()', profile.name);
        const content = new Content(profile.url);
        if (options.secure) {
            const fileContent = fs.readFileSync(filePath);
            const fileBaseName = path.basename(filePath);

            const secureContent = {};
            secureContent[fileBaseName] = new Buffer(fileContent).toString('base64');
            content.uploadSecureContent(profile.token, contentKey, secureContent).then((response) => {
                if (response.success) {
                    printSuccess(`Secure content successfully uploaded.`, options);
                }
                else {
                    printError(`Failed to upload secure content: ${response.status} ${response.message}`, options);
                }
            })
        }
        else {
            const payload = {'content': filePath, 'key': contentKey};
            content.uploadContent(profile.token, payload).then((response) => {
                if (response.success) {
                    printSuccess(`Content successfully uploaded.`, options);
                }
                else {
                    printError(`Failed to upload content: ${response.status} ${response.message}`, options);
                }
            })
            .catch((err) => {
                debug(err);
                printError(`Failed to upload content: ${err.status} ${err.message}`, options);
            });
        }
    }
};

module.exports.DeleteContent = class DeleteContent {

    constructor(program) {
        this.program = program;
    }

    execute(contentKey, options) {
        const profile = loadProfile(options.profile);
        debug('%s.deleteContent()', profile.name);

        const content = new Content(profile.url);
        content.deleteContent(profile.token, contentKey).then((response) => {
            if (response.success) {
               printSuccess(`Content successfully deleted.`, options);
            }
            else {
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

    execute(contentKey, options) {
        const profile = loadProfile(options.profile);
        debug('%s.DownloadContent()', profile.name);

        const content = new Content(profile.url);

        // To download content from Secrets
        if (options.secure) {
            content.downloadSecureContent(profile.token, contentKey).then((response) => {
                if (response.success) {
                    printSuccess(response.message, options);
                }
                else {
                    printError(`Failed to download secure content: ${response.status} ${response.message}`, options);
                }
            })
                .catch((err) => {
                    debug(err);
                    printError(`Failed to download secure content: ${err.status} ${err.message}`, options);
                });
        }
        content.downloadContent(profile.token, contentKey).then((response) => {
            if (response.success) {
                printSuccess(response.message, options);
            }
            else {
                printError(`Failed to download content: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to download content: ${err.status} ${err.message}`, options);
        });
    }
};
