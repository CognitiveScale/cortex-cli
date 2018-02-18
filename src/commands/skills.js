/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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
const yeoman = require('yeoman-environment');
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const { printSuccess, printError, filterObject, parseObject, printTable } = require('./utils');

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
            }
            else {
                printError(`Failed to save skill: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to save skill: ${err.status} ${err.message}`, options);
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
        catalog.listSkills(profile.token).then((response) => {
            if (response.success) {
                if (options.query || options.json) {
                    let result = filterObject(response.skills, options);
                    printSuccess(JSON.stringify(result, null, 2), options);
                }
                else {
                    const tableSpec = [
                        { column: 'Title', field: 'title', width: 50 },
                        { column: 'Name', field: 'name', width: 50 },
                        { column: 'Version', field: '_version', width: 12 }
                    ];

                    printTable(tableSpec, response.skills);
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
        catalog.describeSkill(profile.token, skillName).then((response) => {
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

module.exports.GenerateSkillCommand = class GenerateSkillCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.generateSkill()', options.profile);
        const yenv = yeoman.createEnv();
        yenv.lookup(()=>{
            yenv.run('@c12e/cortex:skill',
            { },
            (err) => { err ? printError(err) : printSuccess('Done.') });
        });
    }
};
