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
const fs = require('fs');
const _ = require('lodash');

const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Sessions = require('../client/sessions');
const { SESSIONTABLEFORMAT, formatValidationPath, filterListObject } = require('./utils');

const {
    printSuccess, printError, filterObject, parseObject, printTable,
} = require('./utils');

module.exports.SaveSessionCommand = class SaveSessionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(sessionDefinition, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeSaveSession(%s)', profile.name, sessionDefinition);
        if (!fs.existsSync(sessionDefinition)) {
            printError(`File does not exist at: ${sessionDefinition}`);
        }
        const sessionDefStr = fs.readFileSync(sessionDefinition);
        const session = parseObject(sessionDefStr, options);
        debug('%o', session);

        const sessions = new Sessions(profile.url);
        sessions.saveSession(options.project || profile.project, profile.token, session).then((response) => {
            if (response.success) {
                printSuccess(_.get(response, 'message.message', 'Session saved'), options);
            } else if (response.details) {
                console.log(`Failed to save session: ${response.status} ${response.message}`);
                console.log('The following issues were found:');
                const tableSpec = [
                    { column: 'Path', field: 'path', width: 50 },
                    { column: 'Message', field: 'message', width: 100 },
                ];
                response.details.map((d) => d.path = formatValidationPath(d.path));
                printTable(tableSpec, response.details);
                printError(''); // Just exit
            } else {
                printError(JSON.stringify(response));
            }
        })
            .catch((err) => {
                printError(`Failed to save session: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ListSessionsCommand = class ListSessionsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListSessions()', profile.name);
        const sessions = new Sessions(profile.url);
        sessions.listSessions(options.project || profile.project, profile.token, options.limit).then((response) => {
            if (response.success) {
                let result = response.sessions;

                if (options.json) {
                    if (options.query) result = filterListObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printTable(SESSIONTABLEFORMAT, result);
                }
            } else {
                printError(`Failed to list sessions: ${response.status} ${response.message}`, options);
            }
        })
            .catch((err) => {
                debug(err);
                printError(`Failed to list sessions: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeSessionCommand = class DescribeSessionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(sessionName, options) {
        const profile = await loadProfile(options.profile);
        const sessions = new Sessions(profile.url);
        debug('%s.executeDescribeSession(%s)', profile.name, sessionName);
        sessions.describeSession(options.project || profile.project, profile.token, sessionName, options.verbose).then((response) => {
            if (response.success) {
                const result = filterObject(response.session, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to describe session ${sessionName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe session ${sessionName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DeleteSessionCommand = class DeleteSessionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(sessionName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteSession(%s)', profile.name, sessionName);
        const sessions = new Sessions(profile.url);
        sessions.deleteSession(options.project || profile.project, profile.token, sessionName)
            .then((response) => {
                if (response && response.success) {
                    const result = filterObject(response, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Session deletion failed: ${response.status} ${response.message}.`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to delete session: ${err.status} ${err.message}`, options);
            });
    }
};
