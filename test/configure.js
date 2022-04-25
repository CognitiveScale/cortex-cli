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
const Info = require('../src/client/info');

const iatDate = new Date('January 11, 2011 11:11:11').getTime();

function parseJwt(jwt) {
    const parts = jwt.split('.');
    const header = JSON.parse(Buffer.from(parts[0], 'base64')
        .toString('ascii'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64')
        .toString('ascii'));
    return {
        header,
        payload,
    };
}

describe('configure', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cortex-cli'));
    let restore;
    let sandbox;
    let printSpy;
    let errorSpy;
    before(() => {
        restore = mockedEnv({
            CORTEX_CONFIG_DIR: tmpDir,
        });
    });

    beforeEach(() => {
        delete require.cache[require.resolve('commander')];
        delete require.cache[require.resolve('../bin/cortex-configure')];

        sandbox = sinon.createSandbox();
        sandbox.stub(Info.prototype, 'getInfo').callsFake(() => ({
                serverTs: iatDate,
        }));
        printSpy = sandbox.spy(console, 'log');
        errorSpy = sandbox.spy(console, 'error');
        fs.copyFileSync('./test/cortex/config', path.join(tmpDir, 'config'));
    });

    afterEach(() => {
        sandbox.restore();
    });

    after(() => {
        restore();
    });

    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }

    function getErrorLines() {
        return _.flatten(errorSpy.args).map((s) => stripAnsi(s));
    }

    it('lists profiles', async () => {
        const program = require('../bin/cortex-configure');
        await program.parseAsync(['node', 'configure', 'list']);
        sandbox.assert.calledTwice(printSpy);
        // default is set at default...
        expect(getPrintedLines()).to.eql(['default', 'other']);
    });

    it('get profile other', async () => {
        const program = require('../bin/cortex-configure');
        await program.parseAsync(['node', 'configure', 'describe', 'other']);
        const output = getPrintedLines();
        expect(output).to.length(5);
        expect(output[4]).to.eql('Project: otherProj');
    });

    it('ttl token default ttl', async () => {
        const program = require('../bin/cortex-configure');
        await program.parseAsync(['node', 'configure', 'token']);
        const output = getPrintedLines();
        const { payload } = parseJwt(output[0]);
        expect(payload.sub).to.equal('test_user');
        expect(payload.aud).to.equal('cortex');
        expect(payload.iat).to.equal(iatDate / 1000);
        expect(payload.exp).to.equal((iatDate / 1000) + (24 * 3600)); // Expect 1 day default
        expect(output).to.length(1);
    });

    it('ttl token default with other profile', async () => {
        const program = require('../bin/cortex-configure');
        await program.parseAsync(['node', 'configure', 'token', '--profile', 'other']);
        const output = getPrintedLines();
        const { payload } = parseJwt(output[0]);
        expect(payload.sub).to.equal('other_user');
        expect(payload.aud).to.equal('cortex');
        expect(payload.iat).to.equal(iatDate / 1000);
        expect(payload.exp).to.equal((iatDate / 1000) + (24 * 3600)); // Expect 1 day default
        expect(output).to.length(1);
    });

    it('ttl token with ttl', async () => {
        const program = require('../bin/cortex-configure');
        await program.parseAsync(['node', 'configure', 'token', '--ttl', '5m', '--profile', 'other']);
        const output = getPrintedLines();
        const { payload } = parseJwt(output[0]);
        expect(payload.sub).to.equal('other_user');
        expect(payload.aud).to.equal('cortex');
        expect(payload.iat).to.equal(iatDate / 1000);
        expect(payload.exp).to.equal((iatDate / 1000) + (5 * 60));
    });

    it('ttl token with bad ttl', async () => {
        const program = require('../bin/cortex-configure');
        await program.parseAsync(['node', 'configure', 'token', '--ttl', '99mx']);
        const output = getErrorLines();
        expect(output[0]).to.contain('Invalid --ttl');
    });

    it('ttl token default with bad profile', async () => {
        const program = require('../bin/cortex-configure');
        await program.parseAsync(['node', 'configure', 'token', '--profile', 'nothere']);
        const output = getErrorLines();
        expect(output[0]).to.contain('Profile with name "nothere" could not be located in your configuration.');
        expect(output).to.length(1);
    });


    it('create profile pat file', async () => {
        const program = require('../bin/cortex-configure');
        await program.parseAsync(['node', 'configure', '--file', './test/cortex/pat-file.json', '--project', 'test', '--profile', 'conftest']);
        const output = getPrintedLines();
        expect(output).to.length(2);
        expect(output[1]).to.eql('Configuration for profile conftest saved.');
        const conf = yaml.load(fs.readFileSync(path.join(tmpDir, 'config')));
        expect(conf.profiles.conftest).to.haveOwnProperty('project', 'test');
        printSpy.resetHistory();
        await program.parseAsync(['node', 'configure', 'list']);
        expect(getPrintedLines()).to.eql(['default', 'other', 'conftest']);
    });
});
