import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Catalog from '../client/catalog.js';
import {
    LISTTABLEFORMAT, filterObject, printExtendedLogs, getFilteredOutput,

    printSuccess, parseObject, handleTable, handleError,
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
            await catalog.saveType(options.project || profile.project, profile.token, normalizedType);
            return printSuccess('Type definition saved', options);
        } catch (err) {
            return handleError(err, options, 'Failed to save type');
        }
    }
}
export class ListTypesCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListTypes()', profile.name);
        const catalog = new Catalog(profile.url);
        try {
        const { types } = await catalog.listTypes(options.project || profile.project, profile.token, options.limit, options.skip, options.sort);
        // TODO remove --query on deprecation
        if (options.json || options.query) {
            getFilteredOutput(types, options);
        } else {
            printExtendedLogs(types, options);
            handleTable(LISTTABLEFORMAT, types, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No types found');
                }
        } catch (err) {
            handleError(err, options, 'Failed to list types');
        }
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
        try {
            const response = await catalog.describeType(options.project || profile.project, profile.token, typeName);
            getFilteredOutput(response, options);
        } catch (err) {
            handleError(err, options, `Failed to describe type ${typeName}`);
        }
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
        try {
            const response = await catalog.deleteType(options.project || profile.project, profile.token, typeName);
            const result = filterObject(response, options);
            return printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            return handleError(err, options, `Failed to delete type ${typeName}`);
        }
    }
}
