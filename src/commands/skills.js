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
const _ = require('lodash');
const fs = require('fs');
const debug = require('debug')('cortex:cli');
const moment = require('moment');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const Agent = require('../client/agents');

const {
    printSuccess, printError, printWarning, filterObject, parseObject, printTable, formatValidationPath,
    LISTTABLEFORMAT, DEPENDENCYTABLEFORMAT, isNumeric,
} = require('./utils');

module.exports.SaveSkillCommand = class SaveSkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillDefinition, options) {
        try {
            const profile = await loadProfile(options.profile);
            const skillDefStr = fs.readFileSync(skillDefinition);
            const skill = parseObject(skillDefStr, options);
            debug('%s.executeSaveSkill(%s)', profile.name, skillDefinition);
            const catalog = new Catalog(profile.url);
            if (!_.isEmpty(options.k8sResource)) {
                const k8sResources = options.k8sResource.map((f) => JSON.stringify(parseObject(fs.readFileSync(f), options)));
                if (_.isEmpty(_.get(skill, 'actions', []))) {
                    printError('Skill must contain an action to apply kubernetes resources', options, true);
                }
                if (skill.actions.length > 1) {
                    printWarning('Applying kubernetes resources to all actions');
                }
                skill.actions.map((a) => a.k8sResources = k8sResources);
            }
            if (options.scaleCount) {
                if (!isNumeric(options.scaleCount)) {
                    printError('--scaleCount must be a number', options);
                }
                if (skill.actions.length > 1) {
                    printWarning('Applying kubernetes resources to all actions');
                }
                const scaleCount = parseInt(options.scaleCount, 10);
                skill.actions.map((a) => a.scaleCount = scaleCount);
            }

            if (options.podspec) {
                const paramsStr = fs.readFileSync(options.podspec);
                const podSpec = parseObject(paramsStr, options);
                skill.actions.map((a) => a.podSpec = podSpec);
            }
            const response = await catalog.saveSkill(options.project || profile.project, profile.token, skill);
            if (response.success) {
                printSuccess(`Skill saved: ${JSON.stringify(response.message)}`, options);
            } else {
                    console.log(`Failed to save skill: ${response.message}`);
                    if (response.details) {
                        console.log('The following issues were found:');
                        const tableSpec = [
                            { column: 'Path', field: 'path', width: 50 },
                            { column: 'Message', field: 'message', width: 100 },
                        ];
                        response.details.map((d) => d.path = formatValidationPath(d.path));
                        printTable(tableSpec, response.details);
                    }
                    printError(''); // Just exit
                }
        } catch (err) {
            printError(`Failed to save skill: ${_.get(err, 'status', '')} ${_.get(err, 'response.body.error', err.message)}`, options);
        }
    }
};

module.exports.ListSkillsCommand = class ListSkillsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeListSkills()', profile.name);

        const catalog = new Catalog(profile.url);
        try {
            const status = !_.get(options, 'nostatus', false); // default show status, if nostatus==true status == false
            const shared = !_.get(options, 'noshared', false);
            const response = await catalog.listSkills(options.project || profile.project, profile.token, { status, shared });
            if (response.success) {
                let result = response.skills;
                const tableFormat = LISTTABLEFORMAT;
                if (options.nostatus === undefined) {
                    result = result.map((skillStat) => {
                        const statuses = _.isEmpty(skillStat.actionStatuses) ? skillStat.deployStatus : skillStat.actionStatuses.map((s) => `${s.name}: ${s.state}`).join(' ');
                        return {
                            ...skillStat,
                            status: statuses,
                        };
                    });
                    tableFormat.push({ column: 'Status', field: 'status', width: 30 });
                }

                if (options.json) {
                    if (options.query) result = filterObject(result, options);
                    return printSuccess(JSON.stringify(result, null, 2), options);
                }
                return printTable(tableFormat,
                    _.sortBy(result, ['name']), (o) => ({ ...o, updatedAt: o.updatedAt ? moment(o.updatedAt).fromNow() : '-' }));
            }
            return printError(`Failed to list skills: ${response.status} ${response.message}`, options);
        } catch (err) {
            return printError(`Failed to list skills: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.DescribeSkillCommand = class DescribeSkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDescribeSkill(%s)', profile.name, skillName);

        const catalog = new Catalog(profile.url);
        try {
            let response = await catalog.describeSkill(options.project || profile.project, profile.token, skillName, options.verbose, options.output);
            if (_.get(options, 'output', 'json').toLowerCase() === 'json') response = JSON.stringify(filterObject(response, options), null, 2);
            printSuccess(response, options);
        } catch (err) {
            printError(`Failed to describe skill ${skillName}: ${err.status} ${err.message}`, options);
        }
    }
};

module.exports.UndeploySkillCommand = class UndeploySkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillNames, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        await Promise.all(skillNames.map(async (skillName) => {
            debug('%s.executeUndeploySkill(%s)', profile.name, skillName);
            try {
                const response = await catalog.unDeploySkill(options.project || profile.project, profile.token, skillName, options.verbose);
                if (response.success) {
                    printSuccess(`Undeploy Skill ${skillName}: ${response.message}`, options);
                } else {
                    printError(`Failed to Undeploy Skill ${skillName}: ${response.message}`, options);
                }
            } catch (err) {
                printError(`Failed to Undeploy Skill ${skillName}: ${err.status} ${err.message}`, options);
            }
        }));
    }
};

module.exports.SkillLogsCommand = class SkillLogsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillName, actionName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeSkillLogs(%s,%s)', profile.name, skillName, actionName);
        const catalog = new Catalog(profile.url);
        catalog.skillLogs(options.project || profile.project, profile.token, skillName, actionName, options.verbose).then((response) => {
            if (response.success) {
                printSuccess(JSON.stringify(response.logs), options);
            } else {
                printError(`Failed to List Skill/Action Logs ${skillName}/${actionName}: ${response.message}`, options);
            }
        })
            .catch((err) => {
                printError(`Failed to List Skill/Action Logs ${skillName}/${actionName}: ${err.status} ${err.message}`, options);
            });
    }
};

module.exports.DeploySkillCommand = class DeploySkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillNames, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        await Promise.all(skillNames.map(async (skillName) => {
            debug('%s.executeDeploySkill(%s)', profile.name, skillName);
            try {
                const response = await catalog.deploySkill(options.project || profile.project, profile.token, skillName, options.verbose);
                if (response.success) {
                    printSuccess(`Deployed Skill ${skillName}: ${response.message}`, options);
                } else {
                    printError(`Failed to deploy Skill ${skillName}: ${response.message}`, options);
                }
            } catch (err) {
                printError(`Failed to deploy Skill ${skillName}: ${err.status} ${err.message}`, options);
            }
        }));
    }
};

module.exports.InvokeSkillCommand = class InvokeSkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillName, inputName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeInvokeSkill(%s/%s)', profile.name, skillName, inputName);

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

        const agent = new Agent(profile.url);
        agent.invokeSkill(options.project || profile.project, profile.token, skillName, inputName, params).then((response) => {
            if (response.success) {
                const result = filterObject(response.result, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            } else {
                printError(`Skill invoke failed: ${response.message}`, options);
            }
        })
            .catch((err) => {
                if (err.response && err.response.body) {
                    debug('Raw error response: %o', err.response.body);
                    printError(`Failed to invoke skill(${err.status} ${err.message}): ${err.response.body.error}`, options);
                } else {
                    printError(`Failed to invoke skill: ${err.status} ${err.message}`, options);
                }
            });
    }
};

module.exports.DeleteSkillCommand = class DeleteSkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.executeDeleteSkill(%s)', profile.name, skillName);
        const catalog = new Catalog(profile.url);
        catalog.deleteSkill(options.project || profile.project, profile.token, skillName)
            .then((response) => {
                if (response.success) {
                    const result = filterObject(response, options);
                    if (options.json) {
                        return printSuccess(JSON.stringify(result, null, 2), options);
                    }
                    return printSuccess(result.message);
                }
                if (response.status === 403) { // has dependencies
                    const tableFormat = DEPENDENCYTABLEFORMAT;
                    printError(`Skill deletion failed: ${response.message}.`, options, false);
                    return printTable(tableFormat, response.details);
                }
                return printError(`Skill deletion failed: ${response.status} ${response.message}.`, options);
            })
            .catch((err) => {
                printError(`Failed to delete skill: ${err.status} ${err.message}`, options);
            });
    }
};
