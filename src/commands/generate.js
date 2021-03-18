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

const path = require('path');
const { Plop, run } = require('plop');
const fs = require('fs');
const mkdirp = require('mkdirp');

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
        const repoPath = _.get(options, 'path', '.');
        if (!fs.existsSync(repoPath)) {
            printError(`ERROR: Path "${repoPath}" doesn't exist`);
        }
        const skillPath = path.join(repoPath, 'skills');
        try {
            const campaign = await cli.getCampaign(options.project || profile.project, profile.token, campaignName);
            printSuccess(`Generating skeleton project for ${campaign.name}`);
            const skills = new Set();
            campaign.missions.forEach((m) => {
                printSuccess(` Mission ${m.name}`);
                m.interventions.forEach((i) => {
                    if (_.has(i, 'action.skill')) {
                        printSuccess(`    Intervention ${i.name} => Skill: ${i.action.skill.name}`);
                        skills.add(i.action.skill.name);
                    }
                });
            });
            skills.forEach((s) => {
                const skillName = s.replace('/', '-');
                mkdirp.sync(path.join(skillPath, skillName));
            });
            console.log(JSON.stringify(campaign));
        } catch (err) {
            printError(`Failed to generate campaign resources: ${err.status} ${err.message}`, options);
        }
    }
};
