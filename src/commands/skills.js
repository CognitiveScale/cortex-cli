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
const debug = require('debug')('cortex:cli');
const { loadProfile } = require('../config');
const Catalog = require('../client/catalog');
const yeoman = require('yeoman-environment');

const { printSuccess, printError, filterObject, parseObject } = require('./utils');

module.exports.SaveSkillCommand = class SaveSkillCommand {

    constructor(program) {
        this.program = program;
    }

    execute(skillDefinition, options) {
        debug('%s.executeSaveSkill(%s)', options.profile, skillDefinition);
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);

        const skillDefStr = fs.readFileSync(skillDefinition);
        const skill = parseObject(skillDefStr, options);

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
        debug('%s.executeListSkills()', options.profile);
        const profile = loadProfile(options.profile);
        const catalog = new Catalog(profile.url);
        
        catalog.listSkills(profile.token).then((response) => {
            if (response.success) {
                let result = filterObject(response.skills, options);
                printSuccess(JSON.stringify(result, null, 2), options);
            }
            else {
                printError(`Failed to list skills: ${response.status} ${response.message}`, options);
            }
        })
        .catch((err) => {
            printError(`Failed to list skills ${skillName}: ${err.status} ${err.message}`, options);
        });
    }
};

module.exports.DescribeSkillCommand = class DescribeSkillCommand {

    constructor(program) {
        this.program = program;
    }

    execute(skillName, options) {
        debug('%s.executeDescribeSkill(%s)', options.profile, skillName);
        const profile = loadProfile(options.profile);
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
            yenv.run('cortex:skill',
            { },
            (err) => { console.log(err); });
        });
    }
};
