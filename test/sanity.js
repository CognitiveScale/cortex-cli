/*
 * Copyright 2020 Cognitive Scale, Inc. All Rights Reserved.
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

const commander = require('commander');
const { ListProfilesCommand, ConfigureCommand } = require('../src/commands/configure');

describe('sanity check', () => {
    it('lists profiles', (done) => {
        const program = new commander.Command();
        const command = new ListProfilesCommand(program);
        command.execute({ color: 'on' });
        done();
    });
    // TODO fix unit test config so it doesn't overwrite users home dir, `CORTEX_CONFIG_DIR=./test/cortex` is not being honored from package.json
    xit('Creates a new profile', (done) => {
        const program = new commander.Command();
        const command = new ConfigureCommand(program);
        command.execute({ color: 'on', profile: 'test', file: 'test/files/pat.json' });
        done();
    });
});
