import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Catalog from '../client/catalog.js';
import {
 LISTTABLEFORMAT, filterObject, printExtendedLogs, handleListFailure, getFilteredOutput, 

 printSuccess, printError, parseObject, handleTable, 
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export class SaveTypeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(typeDefinition, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeSaveType(%s)', profile.name, typeDefinition);
        try {
            const typeDefStr = fs.readFileSync(typeDefinition);
            const type = parseObject(typeDefStr, options);
            debug('%o', type);
            let normalizedType = {};
            if (!('types' in type)) normalizedType.types = [type];
            else normalizedType = type;
            const catalog = new Catalog(profile.url);
            const response = await catalog.saveType(options.project || profile.project, profile.token, normalizedType);
            if (response.success) {
                return printSuccess('Type definition saved', options);
            }
            return printError(`${response.message}: ${JSON.stringify(response.details || '')} `);
        } catch (err) {
            return printError(`Failed to save type: ${err.status} ${err.message}`, options);
        }
    }
}
export class ListTypesCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListTypes()', profile.name);
        const catalog = new Catalog(profile.url);
        // eslint-disable-next-line consistent-return
        catalog.listTypes(options.project || profile.project, profile.token, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                const result = response.types;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    printExtendedLogs(result, options);
                    handleTable(LISTTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No types found');
                }
            } else {
                return handleListFailure(response, options, 'Types');
            }
        })
            .catch((err) => {
            printError(`Failed to list types: ${err.status} ${err.message}`, options);
        });
    }
}
export class DescribeTypeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(typeName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeType(%s)', profile.name, typeName);
        const catalog = new Catalog(profile.url);
        catalog.describeType(options.project || profile.project, profile.token, typeName).then((response) => {
            if (response.success) {
                getFilteredOutput(response.type, options);
            } else {
                printError(`Failed to describe type ${typeName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
            printError(`Failed to describe type ${typeName}: ${err.status} ${err.message}`, options);
        });
    }
}
export class DeleteTypeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(typeName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteType(%s)', profile.name, typeName);
        const catalog = new Catalog(profile.url);
        catalog.deleteType(options.project || profile.project, profile.token, typeName).then((response) => {
            if (response.success) {
                const result = filterObject(response.type, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to delete type ${typeName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
            printError(`Failed to delete type ${typeName}: ${err.status} ${err.message}`, options);
        });
    }
}
