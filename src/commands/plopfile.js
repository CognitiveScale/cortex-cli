const path = require('path');

module.exports = plop => {
    plop.setGenerator('skill', {
        description: 'Generate Cortex Skill project',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Skill Name?'
            },
            {
                type: 'list',
                name: 'type',
                message: 'Skill Type?',
                choices: ['Daemon', 'Job', 'REST API']
            }
        ],
        actions: [
            {
                type: 'addMany',
                // Current directory for the new files
                destination: path.join(path.resolve('.'), 'src/{{name}}/'),
                // Handlebars template used to generate content of project files
                base: path.join(path.dirname(require.resolve('@c12e/generator-cortex/generators/skill/{{type}}'))),
                templateFiles: path.join(path.dirname(require.resolve('@c12e/generator-cortex/generators/skill/{{type}}')), '**/*.js.hbs'),
                abortOnFail: true,
                // Must not overwrite files with scaffolding template if already exists
                // force: true,
                // verbose: true
            },
        ],
    });
};
