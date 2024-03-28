import fs from 'node:fs';
import _ from 'lodash';
import debugSetup from 'debug';
import { loadProfile } from '../config.js';
import Sessions from '../client/sessions.js';
import {
    SESSIONTABLEFORMAT, getFilteredOutput,

    printSuccess, printError, filterObject, parseObject, handleTable, handleError,
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
        try {
            const sessions = new Sessions(profile.url);
            const response = await sessions.saveSession(options.project || profile.project, profile.token, session);
            printSuccess(_.get(response, 'message.message', 'Session saved'), options);
        } catch (err) {
            handleError(err, options, 'Failed to save session');
        }
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
        try {
            const { sessions: result } = await sessions.listSessions(options.project || profile.project, profile.token, options.limit);
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                return getFilteredOutput(result, options);
            }
            return handleTable(SESSIONTABLEFORMAT, result, null, 'No sessions found');
        } catch (err) {
            return handleError(err, options, 'Failed to list sessions');
        }
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
        try {
            const response = await sessions.describeSession(options.project || profile.project, profile.token, sessionName, options.verbose);
            getFilteredOutput(response.session, options);
        } catch (err) {
            handleError(err, options, `Failed to describe session ${sessionName}`);
        }
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
        try {
            const response = await sessions.deleteSession(options.project || profile.project, profile.token, sessionName);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            handleError(err, options, 'Failed to delete session');
        }
    }
}
