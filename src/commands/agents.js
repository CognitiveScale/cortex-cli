import fs from 'node:fs';
import debugSetup from 'debug';
import _ from 'lodash';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
// eslint-disable-next-line import/no-named-as-default
import Catalog from '../client/catalog.js';
import Agents from '../client/agents.js';
import {
    LISTTABLEFORMAT,
    filterObject,
    getFilteredOutput,
    getQueryOptions,
    handleDeleteFailure,
    handleListFailure,
    handleTable,
    parseObject,
    printError,
    printExtendedLogs,
    printSuccess,
    printTable, writeOutput, printErrorDetails, constructError,
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export class ListAgentsCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListAgents()', profile.name);
        const catalog = new Catalog(profile.url);
        // eslint-disable-next-line consistent-return
        catalog.listAgents(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                const result = response.agents;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    printExtendedLogs(result, options);
                    handleTable(LISTTABLEFORMAT, result, (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No agents found');
                }
            } else {
                return handleListFailure(response, options, 'Agents');
            }
        })
            .catch((err) => {
            debug(err);
            printError(`Failed to list agents: ${err.status} ${err.message}`, options);
        });
    }
}
export class DescribeAgentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentName, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        const {
             versions, verbose, output, project,
        } = options;
        if (versions) {
            try {
                debug('%s.executeDescribeAgentVersions(%s)', profile.name, agentName);
                const response = await catalog.describeAgentVersions(options.project || profile.project, profile.token, agentName);
                if (response.success) {
                    return writeOutput(getFilteredOutput(response.agent, options), options);
                }
                return printError(`Failed to describe agent versions ${agentName}: ${response.message}`, options);
            } catch (err) {
                return printError(`Failed to describe agent versions ${agentName}: ${err.status} ${err.message}`, options);
            }
        } else {
            debug('%s.executeDescribeAgent(%s)', profile.name, agentName);
            try {
                const response = await catalog.describeAgent(project || profile.project, profile.token, agentName, verbose, output);
                if ((output ?? 'json').toLowerCase() === 'json') return getFilteredOutput(response, options);
                return writeOutput(response, options);
            } catch (err) {
                return printError(`Failed to describe agent ${agentName}: ${err.status} ${err.message}`, options);
            }
        }
    }
}
export class InvokeAgentServiceCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentName, serviceName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.invokeAgentService(%s, %s)', profile.name, agentName, serviceName);
        let params = {};
        if (options.params) {
            try {
                params = parseObject(options.params, options);
            } catch (e) {
                printError(`Failed to parse params: ${options.params} Error: ${e}`, options);
            }
        } else if (options.paramsFile) {
            if (!fs.existsSync(options.paramsFile)) {
                printError(`File does not exist at: ${options.paramsFile}`);
            }
            const paramsStr = fs.readFileSync(options.paramsFile);
            params = parseObject(paramsStr, options);
        }
        debug('params: %o', params);
        const agents = new Agents(profile.url);
        try {
            const response = await agents.invokeAgentService(options.project || profile.project, profile.token, agentName, serviceName, params, options);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            let message = `Failed to invoke agent service (${err.message})`;
            if (err?.response?.body) {
                message = `${message}: ${err.response.body}`;
            }
            printError(message, options, false);
            printErrorDetails(err, options);
        }
    }
}
export class GetActivationCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(activationId, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.getActivation(%s, %s)', profile.name, activationId, JSON.stringify(options));
        const { report, verbose, project } = options;
        const agents = new Agents(profile.url);
        agents.getActivation(project || profile.project, profile.token, activationId, verbose, report).then((response) => {
            if (response.success) {
                if (options.report && !options.json) {
                    const result = filterObject(response.result, getQueryOptions(options));
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 40 },
                        { column: 'Title', field: 'title', width: 40 },
                        { column: 'Type', field: 'type', width: 20 },
                        { column: 'Status', field: 'status', width: 20 },
                        { column: 'Elapsed (ms)', field: 'elapsed', width: 30 },
                    ];
                    printSuccess(`Status: ${_.get(result, 'status')}`);
                    printSuccess(`Elapsed Time (ms): ${_.get(result, 'elapsed')}`);
                    printTable(tableSpec, _.sortBy(_.get(result, 'transits'), ['start', 'end']));
                } else {
                    getFilteredOutput(response.result, options);
                }
            } else {
                printError(`Failed to get activation ${activationId}: ${response.message}`, options);
            }
        })
            .catch((err) => {
            printError(`Failed to get activation ${activationId}: ${err.status} ${err.message}`, options);
        });
    }
}
export class CancelActivationCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(activationId, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.cancelActivation(%s, %s)', profile.name, activationId, JSON.stringify(options));
        const { inFlight, project } = options;
        const agents = new Agents(profile.url);
        try {
            const response = await agents.cancelActivation(project || profile.project, profile.token, activationId, inFlight);
            printSuccess(response.message);
        } catch (err) {
            const { message } = constructError(err);
            printError(`Failed to cancel activation ${activationId}: ${message}`, options);
        }
    }
}

export class ListActivationsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        if (_.isEmpty(options.agentName)
            && _.isEmpty(options.skillName)
            && _.isEmpty(options.correlationId)
            && _.isEmpty(options.status)) {
            printError('Either --agentName, --skillName, --correlationId, or --status must be provided', options);
        }
        const profile = await loadProfile(options.profile);
        debug('%s.listActivations(%s)', profile.name);
        const agents = new Agents(profile.url);
        // TODO validate param types?
        const queryParams = {};
        if (options.startBefore) queryParams.startBefore = options.startBefore;
        if (options.startAfter) queryParams.startAfter = options.startAfter;
        if (options.endBefore) queryParams.endBefore = options.endBefore;
        if (options.endAfter) queryParams.endAfter = options.endAfter;
        if (options.status) queryParams.status = _.toUpper(options.status);
        if (options.correlationId) queryParams.correlationId = options.correlationId;
        if (options.agentName) queryParams.agentName = options.agentName;
        if (options.skillName) queryParams.skillName = options.skillName;
        if (options.limit) queryParams.limit = options.limit;
        if (options.skip) queryParams.skip = options.skip;
        if (options.sort) queryParams.sort = _.toLower(options.sort);
        if (options.filter) queryParams.filter = options.filter;
        // eslint-disable-next-line consistent-return
        agents.listActivations(options.project || profile.project, profile.token, queryParams).then((response) => {
            if (response.success) {
                const result = response.result.activations;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    printExtendedLogs(result, options);
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 30 },
                        { column: 'Activation Id', field: 'activationId', width: 40 },
                        { column: 'Status', field: 'status', width: 20 },
                        { column: 'Started', field: 'start', width: 65 },
                    ];
                    const genName = (o) => {
                        if (o.agentName) {
                            return `${o.agentName} (Agent)`;
                        }
                        if (o.skillName) {
                            return `${o.skillName} (Skill)`;
                        }
                        return '-';
                    };
                    handleTable(tableSpec, _.map(result, (o) => ({
                        ...o,
                        name: genName(o),
                        start: o.start ? dayjs(o.start).fromNow() : '-',
                    })), null, 'No activations found');
                }
            } else {
                return handleListFailure(response, options, 'Activations');
            }
        })
            .catch((err) => {
            printError(`Failed to list activations: ${err.status} ${err.message}`, options);
        });
    }
}
export class ListServicesCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listServices(%s)', profile.name, agentName);
        const catalog = new Catalog(profile.url);
        try {
            const result = await catalog.listServices(options.project || profile.project, profile.token, agentName, profile);
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                printExtendedLogs(result, options);
                const tableSpec = [
                    { column: 'Service Name', field: 'name', width: 25 },
                    { column: 'Service Endpoint URL', field: 'url', width: 115 },
                    { column: 'Parameters', field: 'formatted_types', width: 65 },
                ];
                handleTable(tableSpec, result, null, 'No services found');
            }
        } catch (err) {
            printError(`Failed to return agent service information: ${agentName}: ${err.status} ${err.message}`, options);
        }
    }
}
export class ListAgentSnapshotsCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(agentName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listAgentSnapshots(%s)', profile.name, agentName);
        const agents = new Agents(profile.url);
        agents.listAgentSnapshots(options.project || profile.project, profile.token, agentName, options.filter, options.limit, options.skip, options.sort)
            // eslint-disable-next-line consistent-return
            .then((response) => {
            if (response.success) {
                const result = response.result.snapshots;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    printExtendedLogs(result, options);
                    const tableSpec = [
                        { column: 'Snapshot ID', field: 'snapshotId', width: 40 },
                        { column: 'Title', field: 'title', width: 40 },
                        // Removed as this is confusing for end users, agent version may not change
                        //                        { column: 'Agent Version', field: 'agentVersion', width: 15 },
                        { column: 'Created', field: 'createdAt', width: 26 },
                        { column: 'Author', field: 'createdBy', width: 26 },
                    ];
                    handleTable(tableSpec, result, (o) => ({ ...o, createdAt: o.createdAt ? dayjs(o.createdAt).fromNow() : '-' }), 'No snapshots found');
                }
            } else {
                return handleListFailure(response, options, 'Agent-snapshots');
            }
        })
            .catch((err) => {
            printError(`Failed to list agent snapshots ${agentName}: ${err.status} ${err.message}`, options);
        });
    }
}
export class DescribeAgentSnapshotCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(snapshotId, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.describeAgentSnapshot(%s)', profile.name, snapshotId);
        const agents = new Agents(profile.url);
        const output = options?.output?.toLowerCase() ?? 'json';
        try {
            const response = await agents.describeAgentSnapshot(options.project || profile.project, profile.token, snapshotId, output);
            if (response.success === false) {
                return printError(`Failed to describe agent snapshot ${snapshotId}: ${response.message}`);
            }
            if (output === 'json') {
                const result = filterObject(JSON.parse(response), options);
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            return printSuccess(response);
        } catch (err) {
            return printError(`Failed to describe agent snapshot ${snapshotId}: ${err.status} ${err.message}`, options);
        }
    }
}
export class CreateAgentSnapshotCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(snapshotDefinition, options) {
        const profile = await loadProfile(options.profile);
        let snapshot;
        if (fs.existsSync(snapshotDefinition)) {
            debug('%s.createAgentSnapshot(%s)', profile.name, snapshotDefinition);
            const snapshotDefStr = fs.readFileSync(snapshotDefinition);
            snapshot = parseObject(snapshotDefStr, options);
        } else if (_.get(options, 'title', '').length > 0 && _.get(options, 'agentName', '').length > 0) {
            snapshot = { agentName: options.agentName, title: options.title };
        } else {
            printError('Either --title <..> and --agentName <..> or a snapshot definition file must be provided', options);
            return;
        }
        const { agentName } = snapshot;
        const agents = new Agents(profile.url);
        agents.createAgentSnapshot(options.project || profile.project, profile.token, snapshot).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Failed to create agent snapshot ${agentName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
            printError(`Failed to create agent snapshot ${agentName}: ${err.status} ${err.message}`, options);
        });
    }
}
export class DeleteAgentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteAgent(%s)', profile.name, agentName);
        const catalog = new Catalog(profile.url);
        catalog.deleteAgent(options.project || profile.project, profile.token, agentName)
            .then((response) => {
            if (response.success) {
                const result = filterObject(response, options);
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            return handleDeleteFailure(response, options, 'Agent');
        })
            .catch((err) => {
            printError(`Failed to delete agent: ${err.status} ${err.message}`, options);
        });
    }
}
export class DeployAgentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentNames, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        await Promise.all(agentNames.map(async (agentName) => {
            debug('%s.executeDeployAgent(%s)', profile.name, agentName);
            try {
                const response = await catalog.deployAgent(options.project || profile.project, profile.token, agentName, options.verbose);
                if (response.success) {
                    printSuccess(`Deployed Agent ${agentName}: ${response.message}`, options);
                } else {
                    printError(`Failed to deploy Agent ${agentName}: ${response.message}`, options);
                }
            } catch (err) {
                printError(`Failed to deploy Agent ${agentName}: ${err.status} ${err.message}`, options);
            }
        }));
    }
}
export class UndeployAgentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentNames, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        await Promise.all(agentNames.map(async (agentName) => {
            debug('%s.executeUndeployAgent(%s)', profile.name, agentName);
            try {
                const response = await catalog.unDeployAgent(options.project || profile.project, profile.token, agentName, options.verbose);
                if (response.success) {
                    printSuccess(`Undeploy agent ${agentName}: ${response.message}`, options);
                } else {
                    printError(`Failed to Undeploy agent ${agentName}: ${response.message}`, options);
                }
            } catch (err) {
                printError(`Failed to Undeploy agent ${agentName}: ${err.status} ${err.message}`, options);
            }
        }));
    }
}
export class SaveAgentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentDefinitions, options) {
        const profile = await loadProfile(options.profile);
        await Promise.all(agentDefinitions.map(async (agentDefinition) => {
            debug('%s.executeSaveAgent(%s)', profile.name, agentDefinition);
            if (!fs.existsSync(agentDefinition)) {
                printError(`File does not exist at: ${agentDefinition}`);
            }
            const agentDefStr = fs.readFileSync(agentDefinition);
            const agent = parseObject(agentDefStr, options);
            debug('%o', agent);
            const catalog = new Catalog(profile.url);
            const project = options.project || profile.project;
            try {
                const response = await catalog.saveAgent(project, profile.token, agent);
                if (response.success) {
                    printSuccess(`Agent "${agent.name}" saved in project "${project}"`, options);
                } else if (response.details) {
                    console.log(`Failed to save agent: ${response.status} ${response.message}`);
                    printErrorDetails(response, options);
                } else {
                    printError(JSON.stringify(response));
                }
            } catch (err) {
                printError(`Failed to save agent: ${err.status} ${err.message}`, options);
            }
        }));
    }
}
