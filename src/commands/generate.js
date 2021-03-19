/*
 * Copyright 2021 Cognitive Scale, Inc. All Rights Reserved.
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
const path = require('path');
const { Plop, run } = require('plop');
const nodePlop = require('node-plop');
const fs = require('fs');
const { loadProfile } = require('../config');
const ApiServerClient = require('../client/apiServerClient');
const {
    printSuccess, printError, // printTable,
} = require('./utils');

module.exports.GenerateSkillCommand = class GenerateSkillCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line no-unused-vars
    execute(options) {
        Plop.launch({
            configPath: path.join(__dirname, 'plopfile.js'),
        }, run);
    }
};

module.exports.GenerateCampaignCommand = class GenerateCampaignCommand {
    constructor(program) {
        this.program = program;
    }

    async execute(campaignName, cmd) {
        const options = cmd.opts();
        const profile = loadProfile(options.profile);
        const cli = new ApiServerClient(profile.url);
        const plopGen = nodePlop(path.join(__dirname, 'plopfile.js'));
        const skillGen = plopGen.getGenerator('skill');
        const repoPath = _.get(options, 'path', '.');
        if (!fs.existsSync(repoPath)) {
            printError(`ERROR: Path "${repoPath}" doesn't exist`);
        }
        const skillPath = path.join(repoPath, 'skills');
        try {
            const campaign = await cli.getCampaign(options.project || profile.project, profile.token, campaignName);
            printSuccess(`Generating skeleton project for ${campaign.name}`);
            const skills = [];
            campaign.missions.forEach((m) => {
                printSuccess(` Mission ${m.name}`);
                m.interventions.forEach((i) => {
                    if (_.has(i, 'action.skill')) {
                        printSuccess(`    Intervention ${i.name} => Skill: ${i.action.skill.name}`);
                        skills.push(i.action.skill.name);
                    }
                });
            });
            // In case a skill is used more than once
            const gens = _.uniq(skills).map(async (s) => {
                const skillName = s.replace('/', '-');
                skillGen.runActions({ name: skillName, type: 'Daemon'});
            });
            await Promise.all(gens);
        } catch (err) {
            printError(`Failed to generate campaign resources: ${err.status} ${err.message}`, options);
        }
    }
};
