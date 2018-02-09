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

const debug = require('debug')('cortex:cli');
const yeoman = require('yeoman-environment');
const { printSuccess, printError, filterObject, parseObject } = require('./utils');

module.exports.GenerateProjectCommand = class GenerateProjectCommand {

    constructor(program) {
        this.program = program;
    }

    execute(options) {
        debug('%s.generateProject()', options.profile);
        const yenv = yeoman.createEnv();
        yenv.register(require.resolve('@c12e/generator-cortex'), 'cortex:app');
        // TODO: figure out which parameters to bubble up to the CLI,
        // and plumb the values through to the yeoman generator.
        yenv.run('cortex:app', { });
    }
};
