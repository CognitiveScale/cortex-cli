module.exports.GenerateSkillCommand = class GenerateSkillCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        const path = require('path');
        const {Plop, run} = require('plop');
        Plop.launch({
            configPath: path.join(__dirname, 'plopfile.js')
        }, run);
    }
};
