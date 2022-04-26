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

const chai = require('chai');
const mockedEnv = require('mocked-env');
const _ = require('lodash');
const sinon = require('sinon');
const fs = require('fs');
const { stripAnsi } = require('./utils');

describe('Workspaces', () => {
    let restoreEnv;
    let sandbox;
    let printSpy;
    let errorSpy;
    before(() => {
        restoreEnv = mockedEnv({
            CORTEX_CONFIG_DIR: '../cortex',
        });
        sandbox = sinon.createSandbox();
        printSpy = sandbox.spy(console, 'log');
        errorSpy = sandbox.spy(console, 'error');

        fs.mkdirSync('test/workspaces', { recursive: true });
        process.chdir('test/workspaces');
    });

    beforeEach(() => {
        delete require.cache[require.resolve('commander')];
        delete require.cache[require.resolve('../bin/cortex-workspaces')];
    });

    after(() => {
        restoreEnv();
        sandbox.restore();
        process.chdir('..');
        fs.rmdirSync('workspaces', { recursive: true });
    });

    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }

    function getErrorLines() {
        return _.flatten(errorSpy.args).map((s) => stripAnsi(s));
    }

    it('should generate a job skill', async () => {
        const program = require('../bin/cortex-workspaces');
        await program.parseAsync(['node', 'workspaces', 'generate', 'job1', '--notree', '--template', 'Custom Job Skill']);
        const output = getPrintedLines();
        const errs = getErrorLines();

        chai.expect(fs.existsSync('docs/job1/README.md'));
        chai.expect(fs.existsSync('skills/job1/skill.yaml'));
        chai.expect(fs.existsSync('skills/job1/actions/job1/main.py'));
        chai.expect(fs.existsSync('skills/job1/actions/job1/requirements.txt'));
        chai.expect(fs.existsSync('skills/job1/actions/job1/Dockerfile'));
        chai.expect(fs.existsSync('skills/job1/invoke/request/message.json'));

        chai.expect(output.join('')).to.contain('Workspace generation complete.');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
    });

    it('should generate a daemon skill', async () => {
        const program = require('../bin/cortex-workspaces');
        await program.parseAsync(['node', 'workspaces', 'generate', 'dmn1', '--notree', '--template', 'Custom Daemon Skill']);
        const output = getPrintedLines();
        const errs = getErrorLines();

        chai.expect(fs.existsSync('docs/dmn1/README.md'));
        chai.expect(fs.existsSync('skills/dmn1/skill.yaml'));
        chai.expect(fs.existsSync('skills/dmn1/actions/dmn1/main.py'));
        chai.expect(fs.existsSync('skills/dmn1/actions/dmn1/requirements.txt'));
        chai.expect(fs.existsSync('skills/dmn1/actions/dmn1/Dockerfile'));
        chai.expect(fs.existsSync('skills/dmn1/invoke/request/message.json'));

        chai.expect(output.join('')).to.contain('Workspace generation complete.');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
    });
});