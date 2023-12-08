import _ from 'lodash';
import fs from 'node:fs';
import debugSetup from 'debug';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { loadProfile } from '../config.js';
import Catalog from '../client/catalog.js';
import Agent from '../client/agents.js';
import {
    constructError,
    printSuccess,
    printError,
    printWarning,
    filterObject,
    parseObject,
    LISTTABLEFORMAT,
    isNumeric,
    handleTable,
    printExtendedLogs,
    handleDeleteFailure,
    getFilteredOutput,
    writeOutput, printErrorDetails, handleError,
} from './utils.js';

const debug = debugSetup('cortex:cli');
dayjs.extend(relativeTime);
export class SaveSkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillDefinitions, options) {
        try {
            const profile = await loadProfile(options.profile);
            await Promise.all(skillDefinitions.map(async (skillDefinition) => {
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
                    if (_.isEmpty(_.get(skill, 'actions', []))) {
                        printError('Skill must contain an action', options, true);
                    }
                    skill.actions.map((a) => a.podSpec = podSpec);
                }
                const response = await catalog.saveSkill(options.project || profile.project, profile.token, skill);
                if (response.success) {
                    printSuccess(`Skill saved: ${JSON.stringify(response.message)}`, options);
                } else {
                    console.log(`Failed to save skill: ${response.message}`);
                    printErrorDetails(response, options);
                    printError(''); // Just exit
                }
            }));
        } catch (err) {
            printError(`Failed to save skill: ${_.get(err, 'status', '')} ${_.get(err, 'response.body.error', err.message)}`, options);
        }
    }
}
export class ListSkillsCommand {
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
            const response = await catalog.listSkills(options.project || profile.project, profile.token, { status, shared }, options.filter, options.limit, options.skip, options.sort);
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
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                return getFilteredOutput(result, options);
            }
            printExtendedLogs(result, options);
            return handleTable(tableFormat, _.sortBy(result, options.sort ? [] : ['name']), (o) => ({ ...o, updatedAt: o.updatedAt ? dayjs(o.updatedAt).fromNow() : '-' }), 'No skills found');
        } catch (err) {
            printError(`Failed to list skills: (${err.message}): ${err.response?.body ?? ''}`, options, false);
            return printErrorDetails(err.response, options, true);
        }
    }
}
export class DescribeSkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillName, options) {
        const profile = await loadProfile(options.profile);
        const {
            verbose, output, project,
        } = options;
        debug('%s.executeDescribeSkill(%s)', profile.name, skillName);
        const catalog = new Catalog(profile.url);
        try {
            const response = await catalog.describeSkill(project || profile.project, profile.token, skillName, verbose, output);
            if ((options?.output ?? 'json').toLowerCase() === 'json') return getFilteredOutput(response, options);
            return writeOutput(response, options);
        } catch (err) {
            return printError(`Failed to describe skill ${skillName}: ${err.status} ${err.message}`, options);
        }
    }
}
export class UndeploySkillCommand {
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
                printSuccess(`Undeploy Skill ${skillName}: ${response.message}`, options);
            } catch (err) {
                const { status, message } = constructError(err);
                printError(`Failed to Undeploy Skill ${skillName}: ${status} ${message}`, options);
            }
        }));
    }
}
export class SkillLogsCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillName, actionName, options) {
        try {
            const profile = await loadProfile(options.profile);
            debug('%s.executeSkillLogs(%s,%s)', profile.name, skillName, actionName);
    
            const catalog = new Catalog(profile.url);
            const response = await catalog.skillLogs(options.project || profile.project, profile.token, skillName, actionName, options.raw);
            if (options.raw) {
                try {
                    const respJSON = JSON.parse(response); // happens with errors
                    if (respJSON?.body) {
                        printError(`Failed to fetch Skill/Action Logs ${skillName}/${actionName}: ${respJSON.body.message}`, options);
                    }
                } catch (err) {
                    printSuccess(response, options);
                }
            } else if (response.success) {
                printSuccess(JSON.stringify(response.logs), options);
            } else {
                printError(`Failed to fetch Skill/Action Logs ${skillName}/${actionName}: ${response.body.message}`, options);
            }
        } catch (err) {
            const { status, message } = constructError(err);
            printError(`Failed to fetch Skill/Action Logs ${skillName}/${actionName}: ${status} ${message}`, options);
        }
    }
}
export class DeploySkillCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(skillNames, options) {
        const profile = await loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        await Promise.all(skillNames.map(async (skillName) => {
            debug('%s.executeDeploySkill(%s)', profile.name, skillName);
            try {
                const response = await catalog.deploySkill(options.project || profile.project, profile.token, skillName, options.stereotypes, options.verbose);
                printSuccess(`Deployed Skill ${skillName}: ${response.message}`, options);
            } catch (err) {
                handleError(err, options, `Failed to deploy Skill ${skillName}`);
            }
        }));
    }
}
export class InvokeSkillCommand {
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
        try {
            const response = await agent.invokeSkill(options.project || profile.project, profile.token, skillName, inputName, params, options.sync);
            const result = filterObject(response, options);
            printSuccess(JSON.stringify(result, null, 2), options);
        } catch (err) {
            let message = `Failed to invoke skill (${err.message})`;
            if (err?.response?.body) {
                message = `${message}: ${err.response.body}`;
            }
            printError(message, options, false);
            printErrorDetails(err, options);
        }
    }
}
export class DeleteSkillCommand {
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
            return handleDeleteFailure(response, options, 'Skill');
        })
            .catch((err) => {
            printError(`Failed to delete skill: ${err.status} ${err.message}`, options);
        });
    }
}
