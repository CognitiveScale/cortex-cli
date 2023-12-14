import _ from 'lodash';
import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Connections from '../client/connections.js';
import Content from '../client/content.js';
import {
    printSuccess,
    printError,
    filterObject,
    parseObject,
    CONNECTIONTABLEFORMAT,
    fileExists,
    handleTable,
    printExtendedLogs,
    getFilteredOutput,
    printErrorDetails, handleError, DEPENDENCYTABLEFORMAT,
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export class ListConnections {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listConnections()', profile.name);
        const conns = new Connections(profile.url);
        // eslint-disable-next-line consistent-return
        try {
            const response = await conns.listConnections(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort);
            const result = response.connections;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                printExtendedLogs(result, options);
                handleTable(CONNECTIONTABLEFORMAT, result, (o) => ({ ...o, createdAt: o.createdAt ? dayjs(o.createdAt).fromNow() : '-' }), 'No connections found');
            }
        } catch (err) {
            debug(err);
            handleError(err, options, 'Failed to list connections');
        }
    }
}
export class SaveConnectionCommand {
    constructor(program) {
        this.program = program;
    }

    getParamsValue(connectionDefinition, paramName) {
        const results = _.filter(_.get(connectionDefinition, 'params', []), (item) => item.name === paramName);
        if (results && results.length) {
            return results[0].value;
        }
        return undefined;
    }

    stripJarPathFromParams(params) {
        return params.filter((item) => item.name !== 'jdbc_jar_file');
    }

    async execute(connectionDefinition, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeSaveDefinition(%s)', profile.name, connectionDefinition);
        if (!fileExists(connectionDefinition)) {
            printError(`File does not exist at: ${connectionDefinition}`);
        }
        const connDefStr = fs.readFileSync(connectionDefinition);
        const connObj = parseObject(connDefStr, options);
        debug('%o', connObj);
        const jdbcJarFilePath = this.getParamsValue(connObj, 'jdbc_jar_file');
        const contentKey = this.getParamsValue(connObj, 'managed_content_key') || this.getParamsValue(connObj, 'plugin_jar');
        if (jdbcJarFilePath && !jdbcJarFilePath.includes('--Insert jar file path--')) {
            try {
                const content = new Content(profile.url);
                const connection = new Connections(profile.url);
                await content.uploadContentStreaming(options.project || profile.project, profile.token, contentKey, jdbcJarFilePath);
                const marshaledConnObj = connObj;
                marshaledConnObj.params = this.stripJarPathFromParams(marshaledConnObj.params);
                await connection.saveConnection(options.project || profile.project, profile.token, marshaledConnObj);
                printSuccess('Connection saved', options);
            } catch (err) {
                handleError(err, options, 'Failed to upload jdbc jar');
            }
        } else {
            try {
            const connection = new Connections(profile.url);
            await connection.saveConnection(options.project || profile.project, profile.token, connObj);
            printSuccess('Connection saved', options);
            } catch (err) {
                handleError(err, options, 'Failed to save connection');
            }
        }
    }
}
export class DescribeConnectionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(connectionName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeConnection(%s)', profile.name, connectionName);
        const connection = new Connections(profile.url);
        try {
            const response = await connection.describeConnection(options.project || profile.project, profile.token, connectionName);
            getFilteredOutput(response.result, options);
        } catch (err) {
            handleError(err, options, `Failed to describe connection ${connectionName}`);
        }
    }
}
export class DeleteConnectionCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(connectionName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteConnection(%s)', profile.name, connectionName);
        const connection = new Connections(profile.url);
        try {
            const response = await connection.deleteConnection(options.project || profile.project, profile.token, connectionName);
            const result = filterObject(response.result, options);
            return printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            return handleError(err, { ...options, tableformat: 'DEPENDENCYTABLEFORMAT' }, 'Failed to delete connection ${connectionName}');
        }
    }
}

export class ListConnectionsTypes {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listConnectionsTypes()', profile.name);
        const conns = new Connections(profile.url);
        // eslint-disable-next-line consistent-return
        try {
            const response = await conns.listConnectionsTypes(profile.token, options.limit, options.skip, options.sort);
            const result = response?.connectionTypes;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                printExtendedLogs(result, options);
                const tableSpec = [
                    {
                        column: 'Name',
                        field: 'name',
                        width: 50,
                    },
                    {
                        column: 'Title',
                        field: 'title',
                        width: 25,
                    },
                    {
                        column: 'Description',
                        field: 'description',
                        width: 50,
                    },
                    {
                        column: 'Created On',
                        field: 'createdAt',
                        width: 26,
                    },
                    {
                        column: 'Updated On',
                        field: 'updatedAt',
                        width: 26,
                    },
                ];
                handleTable(tableSpec, result, null, 'No connection types found');
                }
            } catch (err) {
                debug(err);
                 printError(`Failed to list connection types: ${err.status} ${err.message}`, options, false);
                 printErrorDetails(err?.response, options);
        }
    }
}
