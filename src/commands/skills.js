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
const yeoman = require('yeoman-environment');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

function _formatpath(p){
    let cnt=0, res = '';
    const len = p.length;
    p.forEach(s => {
        if (_.isNumber(s)) {
            res += `[${s}]`
        }else
            if ( cnt < len)
                res += s;
            else
                res +=s;
        if (cnt < len-1 && !_.isNumber(p[cnt+1]))
            res += '.';
        cnt += 1;

    })
    return res;
}

module.exports.SaveSkillCommand = class SaveSkillCommand {

    constructor(program) {
        this.program = program;
    }

    execute(skillDefinition, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeSaveSkill(%s)', profile.name, skillDefinition);

        const skillDefStr = fs.readFileSync(skillDefinition);
        const skill = parseObject(skillDefStr, options);

        const catalog = new Catalog(profile.url);
        catalog.saveSkill(profile.token, skill).then((response) => {
            if (response.success) {
                printSuccess(`Skill saved`, options);
            } else {
                if (response.details) {
                    console.log(`Failed to save skill: ${response.status} ${response.message}`);
                    console.log('The following issues were found:');
                    const tableSpec = [
                        {column: 'Path', field: 'path', width: 50},
                        {column: 'Message', field: 'message', width: 100},
                    ];
                    response.details.map(d => d.path = _formatpath(d.path));
                    printTable(tableSpec,response.details);
                    printError(''); // Just exit

                }
            }
        })
        .catch((err) => {
            printError(`Failed to save skill: ${err.status} ${err.response.body.error}`, options);
        });
    }
};

module.exports.ListSkillsCommand = class ListSkillsCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeListSkills()', profile.name);

        const catalog = new Catalog(profile.url);
        catalog.listSkills(options.projectId || profile.projectId, profile.token).then((response) => {
            if (response.success) {
                let result = response.skills;
                if (options.query)
                    result = filterObject(result, options);

                if (options.json) {
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    const tableSpec = [
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Version', field: '_version', width: 12 }
                    ];

                    printTable(tableSpec, result);
                }
            }
            else {
                printError(`Failed to list skills: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to list skills: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeSkillCommand = class DescribeSkillCommand {

    constructor(program) {
        this.program = program;
    }

    execute(skillName, options) {
        const profile = loadProfile(options.profile);
        debug('%s.executeDescribeSkill(%s)', profile.name, skillName);

        const catalog = new Catalog(profile.url);
        catalog.describeSkill(options.projectId || profile.projectId, profile.token, skillName).then((response) => {
            if (response.success) {
                let result = filterObject(response.skill, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to describe skill ${skillName}: ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to describe skill ${skillName}: ${err.status} ${err.message}`, options);
        });
    }
};
