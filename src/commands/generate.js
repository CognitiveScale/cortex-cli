module.exports.GenerateSkillCommand = class GenerateSkillCommand {
    constructor(program) {
        this.program = program;
    }

    // eslint-disable-next-line no-unused-vars
    execute(options) {
        const path = require('path');
        const { Plop, run } = require('plop');
        Plop.launch({
            configPath: path.join(__dirname, 'plopfile.js'),
        }, run);
    }
};
