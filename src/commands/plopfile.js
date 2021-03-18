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

module.exports = (plop) => {
    plop.setGenerator('skill', {
        description: 'Generate Cortex Skill project',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Skill Name?',
            },
            {
                type: 'list',
                name: 'type',
                message: 'Skill Type?',
                choices: ['Daemon', 'Job', 'External API'],
            },
        ],
        actions: [
            {
                type: 'addMany',
                // Current directory for the new files
                destination: path.join(path.resolve('.'), '{{ dashCase name }}'),
                // Handlebars template used to generate content of project files
                base: 'assets/templates/skill/{{dashCase type}}',
                // Note: Unlike other files, this doesn't strip hbs extension from Dockerfile, because this doesn't have any extension. So not using hbs extension in Dockerfile and picking all files in directory
                templateFiles: 'assets/templates/skill/{{dashCase type}}/**/*',
                abortOnFail: true,
                // Must not overwrite files with scaffolding template if already exists
                // force: true,
                // verbose: true
            },
        ],
    });
};
