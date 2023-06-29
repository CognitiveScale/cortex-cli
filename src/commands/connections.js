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
    handleListFailure,
    handleDeleteFailure,
    getFilteredOutput,
    printErrorDetails,
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
        conns.listConnections(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                const result = response.result.connections;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    printExtendedLogs(result, options);
                    handleTable(CONNECTIONTABLEFORMAT, result, (o) => ({ ...o, createdAt: o.createdAt ? dayjs(o.createdAt).fromNow() : '-' }), 'No connections found');
                }
            } else {
                return handleListFailure(response, options, 'Connections');
            }
        })
            .catch((err) => {
            debug(err);
            printError(`Failed to list connections: ${err.status} ${err.message}`, options);
        });
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
            const content = new Content(profile.url);
            const connection = new Connections(profile.url);
            content.uploadContentStreaming(options.project || profile.project, profile.token, contentKey, jdbcJarFilePath)
                .then(() => {
                const marshaledConnObj = connObj;
                marshaledConnObj.params = this.stripJarPathFromParams(marshaledConnObj.params);
                connection.saveConnection(options.project || profile.project, profile.token, marshaledConnObj).then((response) => {
                    if (response.success) {
                        printSuccess('Connection saved', options);
                    } else {
                        printError(`Failed to save connection: ${response.status} ${response.message}`, options);
                    }
                })
                    .catch((err) => {
                    printError(`Failed to save connection: ${err.response.body.message}`, options);
                });
            })
                .catch((err) => {
                printError(`Failed to upload jdbc jar: ${err.status} ${err.message}`, options);
            });
        } else {
            const connection = new Connections(profile.url);
            connection.saveConnection(options.project || profile.project, profile.token, connObj).then((response) => {
                if (response.success) {
                    printSuccess('Connection saved', options);
                } else {
                    printError(`Failed to save connection: ${response.status} ${response.message}`, options);
                }
            })
                .catch((err) => {
                printError(`Failed to save connection: ${err.response.body.message}`, options);
            });
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
        connection.describeConnection(options.project || profile.project, profile.token, connectionName).then((response) => {
            if (response.success) {
                getFilteredOutput(response.result, options);
            } else {
                printError(`Failed to describe connection ${connectionName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
            printError(`Failed to describe connection ${connectionName}: ${err.status} ${err.message}`, options);
        });
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
        connection.deleteConnection(options.project || profile.project, profile.token, connectionName).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            return handleDeleteFailure(response, options, 'Connection');
        })
            .catch((err) => {
            printError(`Failed to delete connection ${connectionName}: ${err.status} ${err.message}`, options);
        });
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
