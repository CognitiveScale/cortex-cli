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
const debug = require('debug')('cortex:cli');
const _ = require('lodash');
const moment = require('moment');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const Agents = require('../client/agents');
const {
    printSuccess, printError, filterObject, parseObject, printTable, formatValidationPath,
    LISTTABLEFORMAT, DEPENDENCYTABLEFORMAT, validateOptions, OPTIONSTABLEFORMAT, handleTable,
} = require('./utils');

module.exports.SaveAgentCommand = class SaveAgentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentDefinition, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeSaveAgent(%s)', profile.name, agentDefinition);
        if (!fs.existsSync(agentDefinition)) {
            printError(`File does not exist at: ${agentDefinition}`);
        }
        const agentDefStr = fs.readFileSync(agentDefinition);
        const agent = parseObject(agentDefStr, options);
        debug('%o', agent);

        const catalog = new Catalog(profile.url);
        catalog.saveAgent(options.project || profile.project, profile.token, agent).then((response) => {
            if (response.success) {
                printSuccess('Agent saved', options);
            } else if (response.details) {
            console.log(`Failed to save agent: ${response.status} ${response.message}`);
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
            printError(`Failed to save agent: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListAgentsCommand = class ListAgentsCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListAgents()', profile.name);

        const catalog = new Catalog(profile.url);
        const { validOptions, errorDetails } = validateOptions(options, 'AGENT');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Agent list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }
        catalog.listAgents(options.project || profile.project, profile.token, options.filter, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                let result = response.agents;
                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    handleTable(
                        LISTTABLEFORMAT,
                        result,
                        (o) => ({ ...o, updatedAt: o.updatedAt ? moment(o.updatedAt).fromNow() : '-' }),
                        'No agents found',
                    );
                }
            } else {
                printError(`Failed to list agents: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            debug(err);
            printError(`Failed to list agents: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeAgentCommand = class DescribeAgentCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentName, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        if (options.versions) {
            debug('%s.executeDescribeAgentVersions(%s)', profile.name, agentName);
            catalog.describeAgentVersions(options.project || profile.project, profile.token, agentName).then((response) => {
                if (response.success) {
                    const result = filterObject(response.agent, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Failed to describe agent versions ${agentName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to describe agent versions ${agentName}: ${err.status} ${err.message}`, options);
            });
        } else {
            debug('%s.executeDescribeAgent(%s)', profile.name, agentName);
            catalog.describeAgent(options.project || profile.project, profile.token, agentName, options.verbose).then((response) => {
                if (response.success) {
                    const result = filterObject(response.agent, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    printError(`Failed to describe agent ${agentName}: ${response.message}`, options);
                }
            })
            .catch((err) => {
                printError(`Failed to describe agent ${agentName}: ${err.status} ${err.message}`, options);
            });
        }
    }
};

module.exports.InvokeAgentServiceCommand = class {
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
        agents.invokeAgentService(options.project || profile.project, profile.token, agentName, serviceName, params).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Invocation failed: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            if (err.response && err.response.body) {
                debug('Raw error response: %o', err.response.body);
                printError(`Failed to invoke agent service (${err.status} ${err.message}): ${err.response.body.error}`, options);
            } else {
                printError(`Failed to invoke agent service: ${err.status} ${err.message}`, options);
            }
        });
    }
};

module.exports.GetActivationCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(activationId, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.getActivation(%s)', profile.name, activationId);
        const { report, verbose, project } = options;
        const agents = new Agents(profile.url);
        agents.getActivation(project || profile.project, profile.token, activationId, verbose, report).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                if (options.report && !options.json) {
                    const tableSpec = [
                        { column: 'Name', field: 'name', width: 40 },
                        { column: 'Title', field: 'title', width: 40 },
                        { column: 'Type', field: 'type', width: 20 },
                        { column: 'Status', field: 'status', width: 20 },
                        { column: 'Elapsed (ms)', field: 'elapsed', width: 30 },
                    ];
                    printSuccess(`Status: ${result.status}`);
                    printSuccess(`Elapsed Time (ms): ${result.elapsed}`);    
                    printTable(tableSpec, _.sortBy(result.transits, ['start', 'end']));
                } else {
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
            } else {
                printError(`Failed to get activation ${activationId}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to get activation ${activationId}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListActivationsCommand = class {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
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

        const { validOptions, errorDetails } = validateOptions(options, 'ACTIVATION');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Resource list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }

        agents.listActivations(options.project || profile.project, profile.token, queryParams).then((response) => {
            if (response.success) {
                let result = response.result.activations;
                if (options.query) result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
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
                        start: o.start ? moment(o.start).fromNow() : '-',
                    })), null, 'No activations found');
                }
            } else {
                printError(`Failed to list activations: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to list activations: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.ListServicesCommand = class ListServicesCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(agentName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listServices(%s)', profile.name, agentName);

        const catalog = new Catalog(profile.url);
        catalog.listServices(options.project || profile.project, profile.token, agentName, profile, options.filter, options.limit, options.skip, options.sort).then((response) => {
            if (response.success) {
                let result = response.services;
                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Service Name', field: 'name', width: 25 },
                        { column: 'Service Endpoint URL', field: 'url', width: 115 },
                        { column: 'Parameters', field: 'formatted_types', width: 65 },
                    ];
                    handleTable(tableSpec, result, null, 'No services found');
                }
            } else {
                printError(`Failed to return agent service information: ${agentName}: ${response.message}`, options);
            }
        }).catch((err) => {
            printError(`Failed to return agent service information: ${agentName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.ListAgentSnapshotsCommand = class {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line consistent-return
    async execute(agentName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listAgentSnapshots(%s)', profile.name, agentName);

        const agents = new Agents(profile.url);
        const { validOptions, errorDetails } = validateOptions(options, 'SNAPSHOT');
        if (!validOptions) {
            const optionTableFormat = OPTIONSTABLEFORMAT;
            printError('Snapshot list failed.', options, false);
            return printTable(optionTableFormat, errorDetails);
        }
        agents.listAgentSnapshots(options.project || profile.project, profile.token, agentName, options.filter, options.limit, options.skip, options.sort)
            .then((response) => {
            if (response.success) {
                let result = response.result.snapshots;
                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                } else {
                    const tableSpec = [
                        { column: 'Snapshot ID', field: 'snapshotId', width: 40 },
                        { column: 'Title', field: 'title', width: 40 },
// Removed as this is confusing for end users, agent version may not change
//                        { column: 'Agent Version', field: 'agentVersion', width: 15 },
                        { column: 'Created', field: 'createdAt', width: 26 },
                        { column: 'Author', field: 'createdBy', width: 26 },
                    ];
                    handleTable(
                        tableSpec,
                        result,
                        (o) => ({ ...o, createdAt: o.createdAt ? moment(o.createdAt).fromNow() : '-' }),
                        'No snapshots found',
                    );
                }
            } else {
                printError(`Failed to list agent snapshots ${agentName}: ${response.message}`, options);
            }
        })

            .catch((err) => {
                printError(`Failed to list agent snapshots ${agentName}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DescribeAgentSnapshotCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(snapshotId, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.describeAgentSnapshot(%s)', profile.name, snapshotId);

        const agents = new Agents(profile.url);
        const output = _.get(options, 'output', 'json');
        try {
            const response = await agents.describeAgentSnapshot(options.project || profile.project, profile.token, snapshotId, output);
            if (response.success === false) {
                return printError(`Failed to describe agent snapshot ${snapshotId}: ${response.message}`);
            }
            if (output.toLowerCase() === 'json') {
                const result = filterObject(JSON.parse(response), options);
                return printSuccess(JSON.stringify(result, null, 2), options);
            }
            return printSuccess(response);
        } catch (err) {
            return printError(`Failed to describe agent snapshot ${snapshotId}: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.CreateAgentSnapshotCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(snapshotDefinition, options) {
        const profile = await loadProfile(options.profile);
        let snapshot;
        if (snapshotDefinition) {
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
};

module.exports.DeleteAgentCommand = class DeleteAgentCommand {
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
                if (response.status === 403) { // has dependencies
                    const tableFormat = DEPENDENCYTABLEFORMAT;
                    printError(`Agent deletion failed: ${response.message}.`, options, false);
                    return printTable(tableFormat, response.details);
                }
                return printError(`Agent deletion failed: ${response.status} ${response.message}.`, options);
            })
            .catch((err) => {
                printError(`Failed to delete agent: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeployAgentCommand = class DeployAgentCommand {
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
};


module.exports.UndeployAgentCommand = class UndeployAgentCommand {
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
};
