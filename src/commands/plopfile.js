const path = require('path');

module.exports = (plop) => {
    plop.setGenerator('skill', {
        description: 'Generate Cortex Skill project',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Skill Name? (Must be alphanumeric)',
                validate: value => /^[0-9a-zA-Z][0-9a-zA-Z_\- ]{0,18}[0-9a-zA-Z]$/.test(value),
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
                // Note: Unlike other files, this doesn't strip hbs extension from Dockerfile, because this doesn't have any extension.
                // So not using hbs extension in Dockerfile and picking all files in directory
                templateFiles: 'assets/templates/skill/{{dashCase type}}/**/*',
                abortOnFail: true,
                // Must not overwrite files with scaffolding template if already exists
                // force: true,
                // verbose: true
            },
        ],
    });
};
