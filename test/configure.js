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

const mockedEnv = require('mocked-env');
const _ = require('lodash');
const os = require('os');
const path = require('path');
const fs = require('fs');
const sinon = require('sinon');
const { expect } = require('chai');
const yaml = require('js-yaml');
const { stripAnsi } = require('./utils');
 const program = require('../bin/cortex-configure');

let restore;
describe('configure', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cortex-cli'));
    let printSpy;
    before(() => {
        restore = mockedEnv({
            CORTEX_CONFIG_DIR: tmpDir,
        });
    });

    beforeEach(() => {
        printSpy = sinon.spy(console, 'log');
        fs.copyFileSync('./test/cortex/config', path.join(tmpDir, 'config'));
    });

    afterEach(() => {
        printSpy.restore();
    });

    after(() => {
        restore();
    });

    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }

    it('lists profiles', (done) => {
        program.parse(['node', 'configure', 'list']);
        sinon.assert.calledTwice(printSpy);
        // default is set at default...
        expect(getPrintedLines()).to.eql(['default', 'other']);
        done();
    });

    it('get profile other', (done) => {
        program.parse(['node', 'configure', 'describe', 'other']);
        const output = getPrintedLines();
        expect(output).to.length(5);
        expect(output[4]).to.eql('Project: otherProj');
        done();
    });

    it('create profile pat file', (done) => {
        program.parse(['node', 'configure', '--file', './test/cortex/pat-file.json', '--project', 'test', '--profile', 'conftest']);
        const output = getPrintedLines();
        expect(output).to.length(2);
        expect(output[1]).to.eql('Configuration for profile conftest saved.');
        const conf = yaml.load(fs.readFileSync(path.join(tmpDir, 'config')));
        expect(conf.profiles.conftest).to.haveOwnProperty('project', 'test');
        printSpy.resetHistory();
        program.parse(['node', 'configure', 'list']);
        expect(getPrintedLines()).to.eql(['default', 'other', 'conftest']);
        done();
    });
});
