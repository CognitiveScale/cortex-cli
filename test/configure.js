import mockedEnv from 'mocked-env';
import _ from 'lodash';
import assert from 'assert';
import os from 'os';
import path from 'path';
import fs from 'node:fs';
import sinon from 'sinon';
import { expect } from 'chai';
import yaml from 'js-yaml';
import { stripAnsi } from './utils.js';
import Info from '../src/client/info.js';
import { create } from '../bin/cortex-configure.js';

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
        // delete require.cache[require.resolve('commander')];
        // delete require.cache[require.resolve('../bin/cortex-configure')];
        sandbox = sinon.createSandbox();
        sandbox.stub(process, 'exit').throws(Error('EXIT'));
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
        await create().parseAsync(['node', 'configure', 'list']);
        sandbox.assert.calledTwice(printSpy);
        // default is set at default...
        expect(getPrintedLines()).to.eql(['default', 'other']);
    });
    it('get profile other', async () => {
        await create().parseAsync(['node', 'configure', 'describe', 'other']);
        const output = getPrintedLines();
        expect(output).to.length(5);
        expect(output[4]).to.eql('Project: otherProj');
    });
    it('ttl token default ttl', async () => {
        await create().parseAsync(['node', 'configure', 'token']);
        const output = getPrintedLines();
        const { payload } = parseJwt(output[0]);
        expect(payload.sub).to.equal('test_user');
        expect(payload.aud).to.equal('cortex');
        expect(payload.iat).to.equal(iatDate / 1000);
        expect(payload.exp).to.equal((iatDate / 1000) + (24 * 3600)); // Expect 1 day default
        expect(output).to.length(1);
    });
    it('ttl token default with other profile', async () => {
        await create().parseAsync(['node', 'configure', 'token', '--profile', 'other']);
        const output = getPrintedLines();
        const { payload } = parseJwt(output[0]);
        expect(payload.sub).to.equal('other_user');
        expect(payload.aud).to.equal('cortex');
        expect(payload.iat).to.equal(iatDate / 1000);
        expect(payload.exp).to.equal((iatDate / 1000) + (24 * 3600)); // Expect 1 day default
        expect(output).to.length(1);
    });
    it('ttl token with ttl', async () => {
        await create().parseAsync(['node', 'configure', 'token', '--ttl', '5m', '--profile', 'other']);
        const output = getPrintedLines();
        const { payload } = parseJwt(output[0]);
        expect(payload.sub).to.equal('other_user');
        expect(payload.aud).to.equal('cortex');
        expect(payload.iat).to.equal(iatDate / 1000);
        expect(payload.exp).to.equal((iatDate / 1000) + (5 * 60));
    });
    it('ttl token with bad ttl', async () => {
        await create().parseAsync(['node', 'configure', 'token', '--ttl', '99mx']);
        const output = getErrorLines();
        expect(output[0]).to.contain('Invalid --ttl');
    });
    it('ttl token default with bad profile', async () => {
        await create().parseAsync(['node', 'configure', 'token', '--profile', 'nothere']);
        const output = getErrorLines();
        expect(output[0]).to.contain('Profile with name "nothere" could not be located in your configuration.');
        assert(process.exit.calledWith(1));
    });
    it('create profile pat file', async () => {
        await create().parseAsync(['node', 'configure', '--file', './test/cortex/pat-file.json', '--project', 'test', '--profile', 'conftest']);
        const output = getPrintedLines();
        expect(output).to.length(2);
        expect(output[1]).to.eql('Configuration for profile conftest saved.');
        const conf = yaml.load(fs.readFileSync(path.join(tmpDir, 'config')));
        expect(conf.profiles.conftest).to.haveOwnProperty('project', 'test');
        printSpy.resetHistory();
        await create().parseAsync(['node', 'configure', 'list']);
        expect(getPrintedLines()).to.eql(['default', 'other', 'conftest']);
    });
});
