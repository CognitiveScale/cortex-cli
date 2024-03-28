import _ from 'lodash';
import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import Table from 'cli-table3';
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
    isNumeric,
    handleTable,
    printExtendedLogs,
    getFilteredOutput,
    writeOutput, printErrorDetails, handleError,
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export class SaveAppCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(defns, options) {
        try {
            const profile = await loadProfile(options.profile);
            await Promise.all(defns.map(async (defn) => {
                const defnStr = fs.readFileSync(defn);
                const app = parseObject(defnStr, options);
                debug('%s.executeSaveApplication(%s)', profile.name, defnStr);
                const catalog = new Catalog(profile.url);
                if (!_.isEmpty(options.k8sResource)) {
                    const k8sResources = options.k8sResource.map((f) => JSON.stringify(parseObject(fs.readFileSync(f), options)));
                    if (_.isEmpty(_.get(app, 'actions', []))) {
                        printError('Application must contain an action to apply kubernetes resources', options, true);
                    }
                    if (app.actions.length > 1) {
                        printWarning('Applying kubernetes resources to all actions');
                    }
                    app.actions.map((a) => a.k8sResources = k8sResources);
                }
                if (options.scaleCount) {
                    if (!isNumeric(options.scaleCount)) {
                        printError('--scaleCount must be a number', options);
                    }
                    if (app.actions.length > 1) {
                        printWarning('Applying kubernetes resources to all actions');
                    }
                    const scaleCount = parseInt(options.scaleCount, 10);
                    app.actions.map((a) => a.scaleCount = scaleCount);
                }
                if (options.podspec) {
                    const paramsStr = fs.readFileSync(options.podspec);
                    const podSpec = parseObject(paramsStr, options);
                    if (_.isEmpty(_.get(app, 'actions', []))) {
                        printError('Application must contain an action', options, true);
                    }
                    app.actions.map((a) => a.podSpec = podSpec);
                }
                const response = await catalog.saveApplication(options.project || profile.project, profile.token, app);
                printSuccess(`Application saved: ${JSON.stringify(response.message)}`, options);
            }));
        } catch (err) {
            handleError(err, options, 'Failed to save application');
        }
    }
}
export class ListAppsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListApplications()', profile.name);
        const catalog = new Catalog(profile.url);
        try {
            const status = !_.get(options, 'nostatus', false); // default show status, if nostatus==true status == false
            const shared = !_.get(options, 'noshared', false);
            const response = await catalog.listApplications(options.project || profile.project, profile.token, { status, shared }, options.filter, options.limit, options.skip, options.sort);
            let result = response.applications;
            const tableFormat = LISTTABLEFORMAT;
            if (options.nostatus === undefined) {
                result = result.map((appStat) => {
                    const statuses = _.isEmpty(appStat.actionStatuses) ? appStat.deployStatus : appStat.actionStatuses.map((s) => `${s.name}: ${s.state}`).join(' ');
                    return {
                        ...appStat,
                        status: statuses,
                    };
                });
                tableFormat.push({ column: 'Status', field: 'status', width: 30 });
            }
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                return getFilteredOutput(result, options);
            }
            printExtendedLogs(result, options);
            return handleTable(tableFormat, _.sortBy(result, options.sort ? [] : ['name']), (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No applications found');
        } catch (err) {
            printError(`Failed to list applications: (${err.message}): ${err.response?.body ?? ''}`, options, false);
            return printErrorDetails(err.response, options, true);
        }
    }
}

function parseMatch(m) {
    const { uri } = m;
    const matcher = Object.keys(uri).pop();
    const path = Object.values(uri).pop();
    return [matcher, path];
}
export class DescribeAppCommand {
    constructor(program) {
        this.program = program;
    }


    async execute(name, options) {
        const profile = await loadProfile(options.profile);
        const {
            verbose, output, project, json,
        } = options;
        let computedOutput = output;
        // If I specify json/verbose/output=json json ensure output is json.
        if (output.toLowerCase() === 'json' || verbose || json !== undefined) {
            computedOutput = 'json';
        } else {
            computedOutput = output;
        }
        const isPretty = (options?.output ?? 'pretty').toLowerCase() === 'pretty' && computedOutput !== 'json';
        debug('%s.executeDescribeApplication(%s)', profile.name, name);
        const catalog = new Catalog(profile.url);
        try {
            const app = await catalog.describeApplication(
                project || profile.project,
                profile.token, name,
                verbose || isPretty,
                computedOutput,
                 ); // if --json use output JSON
            if (isPretty) {
// Strange spacing needed for output formatting
                printSuccess(`Name: ${app.name}
Description: ${app.description}
Image: ${app?.action?.image}
Created By: ${app._createdBy}
Updated At: ${app._updatedAt}`, options);
                const hTable = new Table({ head: ['Hosts'] });
                hTable.push(...(app?.hosts?.length > 0 ? app.hosts.map((h) => [`https://${h}`]) : [[profile.url]]));
                console.log(hTable.toString());
                printSuccess('Route(s):');
                const rTable = new Table({ head: ['Matcher', 'Path'] });
                rTable.push(...app?.match?.map(parseMatch) ?? []);
                return console.log(rTable.toString());
            }
            if (options?.output?.toLowerCase() === 'json' || json !== undefined) {
                return getFilteredOutput(app, options);
            }
            // format output if json
            return writeOutput(computedOutput === 'json' ? JSON.stringify(app, null, 2) : app, options);
        } catch (err) {
            return printError(`Failed to describe application ${name}: ${err.status ?? ''} ${err.message}`, options);
        }
    }
}
export class UndeployAppCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(names, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        await Promise.all(names.map(async (name) => {
            debug('%s.executeUndeployApplication(%s)', profile.name, name);
            try {
                const response = await catalog.unDeployApplication(options.project || profile.project, profile.token, name);
                printSuccess(`Undeploy Application ${name}: ${response.message}`, options);
            } catch (err) {
                printError(`Failed to Undeploy Application ${name}: ${err.message}`, options);
            }
        }));
    }
}
export class AppLogsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        try {
            const profile = await loadProfile(options.profile);
            debug('%s.executeApplicationLogs(%s,%s)', profile.name, name);
    
            const catalog = new Catalog(profile.url);
            const response = await catalog.applicationLogs(options.project || profile.project, profile.token, name, options.raw);
    
            if (options.raw) {
                try {
                    const respJSON = JSON.parse(response); // happens with errors
                    if (respJSON?.body) {
                        printError(`Failed to List Application Logs ${name}}: ${respJSON.body.message}`, options);
                    }
                } catch (err) {
                    printSuccess(response, options);
                }
            } else if (response.success) {
                printSuccess(JSON.stringify(response.logs), options);
            } else {
                printError(`Failed to List Application Logs ${name}: ${response.body.message}`, options);
            }
        } catch (err) {
            printError(`Failed to List Application Logs ${name}: ${err.message}`, options);
        }
    }
}
export class DeployAppCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(names, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        await Promise.all(names.map(async (name) => {
            debug('%s.executeDeployApplication(%s)', profile.name, name);
            try {
                const response = await catalog.deployApplication(options.project || profile.project, profile.token, name);
                if (response.success) {
                    printSuccess(`Deployed Application ${name}: ${response.message}`, options);
                } else {
                    printError(`Failed to deploy Application ${name}: ${response.message}`, options);
                }
            } catch (err) {
                printError(`Failed to deploy Application ${name}: ${err.message}`, options);
            }
        }));
    }
}

export class DeleteAppCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(name, options) {
        try {
            const profile = await loadProfile(options.profile);
            debug('%s.executeDeleteApplication(%s)', profile.name, name);
            const catalog = new Catalog(profile.url);
            const response = await catalog.deleteApplication(options.project || profile.project, profile.token, name);
            const result = filterObject(response, options);
            if (options.json) {
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            return printSuccess(result.message);
        } catch (err) {
            return handleError(err, options, 'Failed to delete application');
        }
    }
}
