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

const os = require('os');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');

module.exports.readConfig = readConfig = function() {
    const configDir = path.join(os.homedir(), '.cortex');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    const configFile = path.join(configDir, 'config');
    if (fs.existsSync(configFile)) {
        return JSON.parse(fs.readFileSync(configFile));
    }

    return {};
};

const ProfileSchema = Joi.object().keys({
    name: Joi.string().optional(),
    url: Joi.string().uri().required(),
    username: Joi.string().required(),
    account: Joi.string().required(),
    token: Joi.string().required()
});

class Profile {

    constructor(name, {url, username, tenantId, token}) {
        this.name = name;
        this.url = url;
        this.username = username;
        this.account = tenantId;
        this.token = token;
    }

    validate() {
        const {error, value} = Joi.validate(this, ProfileSchema);
        if (error) {
            throw new Error(`Invalid configuration profile <${this.name}>: ${error.details[0].message}.  Please run "cortex configure".`);
        }
        return this;
    }
}

module.exports.loadProfile = function(profileName) {
    const config = readConfig();
    return new Profile(profileName, config[profileName] || {}).validate();
};

module.exports.writeConfig = function(config) {
    const configDir = path.join(os.homedir(), '.cortex');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    const configFile = path.join(configDir, 'config');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
};