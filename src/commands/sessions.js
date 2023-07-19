import fs from 'node:fs';
import _ from 'lodash';
import debugSetup from 'debug';
import { loadProfile } from '../config.js';
import Sessions from '../client/sessions.js';
import {
    SESSIONTABLEFORMAT, handleListFailure, getFilteredOutput,

    printSuccess, printError, filterObject, parseObject, handleTable, printErrorDetails,
} from './utils.js';

const debug = debugSetup('cortex:cli');
export class SaveSessionCommand {
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
                printErrorDetails(response, options);
                printError(''); // Just exit
            } else {
                printError(JSON.stringify(response));
            }
        })
            .catch((err) => {
            printError(`Failed to save session: ${err.status} ${err.message}`, options);
        });
    }
}
export class ListSessionsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListSessions()', profile.name);
        const sessions = new Sessions(profile.url);
        sessions.listSessions(options.project || profile.project, profile.token, options.limit).then((response) => {
            if (response.success) {
                const result = response.sessions;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    return getFilteredOutput(result, options);
                }
                return handleTable(SESSIONTABLEFORMAT, result, null, 'No sessions found');
            }
            return handleListFailure(response, options, 'Sessions');
        })
            .catch((err) => {
            debug(err);
            printError(`Failed to list sessions: ${err.status} ${err.message}`, options);
        });
    }
}
export class DescribeSessionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(sessionName, options) {
        const profile = await loadProfile(options.profile);
        const sessions = new Sessions(profile.url);
        debug('%s.executeDescribeSession(%s)', profile.name, sessionName);
        sessions.describeSession(options.project || profile.project, profile.token, sessionName, options.verbose).then((response) => {
            if (response.success) {
                getFilteredOutput(response.session, options);
            } else {
                printError(`Failed to describe session ${sessionName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
            printError(`Failed to describe session ${sessionName}: ${err.status} ${err.message}`, options);
        });
    }
}
export class DeleteSessionCommand {
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
}
