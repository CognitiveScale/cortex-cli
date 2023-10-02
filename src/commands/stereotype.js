import _ from 'lodash';
import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Catalog from '../client/catalog.js';
import {
    printSuccess,
    printError,
    printWarning,
    filterObject,
    parseObject,
    LISTTABLEFORMAT,
    handleTable,
    printExtendedLogs,
    getFilteredOutput,
    writeOutput,
    handleListFailure,
    handleError,
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export class SaveStereotypeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(documents, options) {
        try {
            const profile = await loadProfile(options.profile);
            await Promise.all(documents.map(async (skillDefinition) => {
                const skillDefStr = fs.readFileSync(skillDefinition);
                const skill = parseObject(skillDefStr, options);
                debug('%s.executeSaveStereotype(%s)', profile.name, skillDefinition);
                const catalog = new Catalog(profile.url);
                if (!_.isEmpty(options.k8sResource)) {
                    const k8sResources = options.k8sResource.map((f) => JSON.stringify(parseObject(fs.readFileSync(f), options)));
                    if (_.isEmpty(_.get(skill, 'action', []))) {
                        printError('Stereotype must contain an action to apply kubernetes resources', options, true);
                    }
                    if (skill.actions.length > 1) {
                        printWarning('Applying kubernetes resources to all actions');
                    }
                    skill.actions.map((a) => a.k8sResources = k8sResources);
                }
                if (options.podspec) {
                    const paramsStr = fs.readFileSync(options.podspec);
                    const podSpec = parseObject(paramsStr, options);
                    if (_.isEmpty(_.get(skill, 'actions', []))) {
                        printError('Stereotype must contain an action', options, true);
                    }
                    skill.actions.map((a) => a.podSpec = podSpec);
                }
                const response = await catalog.saveStereotype(options.project || profile.project, profile.token, skill);
                printSuccess(`Stereotype saved: ${JSON.stringify(response.message)}`, options);
            }));
        } catch (err) {
            handleError(err, options,'Failed to save skill stereotype');
        }
    }
}
export class ListStereotypesCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListStereotypes()', profile.name);
        const catalog = new Catalog(profile.url);
        try {
            const shared = !(options?.noshared ?? false);
            const { stereotypes } = await catalog.listStereotypes(options.project || profile.project, profile.token, { shared }, options.filter, options.limit, options.skip, options.sort);
            const tableFormat = LISTTABLEFORMAT;
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                return getFilteredOutput(stereotypes, options);
            }
            printExtendedLogs(stereotypes, options);
            return handleTable(tableFormat, _.sortBy(stereotypes, options.sort ? [] : ['name']), (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No stereotypes found');
        } catch (err) {
            handleListFailure(err, {}, 'Skill stereotype');
        }
    }
}
export class DescribeStereotypeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        const profile = await loadProfile(options.profile);
        const {
            verbose, output, project,
        } = options;
        debug('%s.executeDescribeStereotype(%s)', profile.name, name);
        const catalog = new Catalog(profile.url);
        try {
            const response = await catalog.describeStereotype(project || profile.project, profile.token, name, verbose, output);
            if ((options?.output ?? 'json').toLowerCase() === 'json') return getFilteredOutput(response, options);
            return writeOutput(response, options);
        } catch (err) {
            return handleError(err, options, `Failed to describe skill ${name}`);
        }
    }
}

export class DeleteStereotypeCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteStereotype(%s)', profile.name, name);
        const catalog = new Catalog(profile.url);
        try {
            const response = await catalog.deleteStereotype(options.project || profile.project, profile.token, name);
            const result = filterObject(response, options);
            if (options.json) {
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            return printSuccess(result.message);
        } catch (err) {
            return handleError(err, options, 'delete stereotype failed');
        }
    }
}
