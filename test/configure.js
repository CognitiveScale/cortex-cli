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
        // reset env variables
        delete process.env.CORTEX_TOKEN;
        delete process.env.CORTEX_URI;
        delete process.env.CORTEX_TIMEOUT_LOOKUP;
        delete process.env.CORTEX_TIMEOUT_CONNECT;
        delete process.env.CORTEX_TIMEOUT_SECURE_CONNECT;
        delete process.env.CORTEX_TIMEOUT_SOCKET;
        delete process.env.CORTEX_TIMEOUT_RESPONSE;
        delete process.env.CORTEX_API_RETRY;
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

    describe('Configure Env', () => {
        const project = 'testproject';
        const totalVars = 4 + 5 + 1 + 3; // default + timeouts + retries + extra
        // eslint-disable-next-line max-len
        const expectedToken = 'eyJhbGciOiJFZERTQSIsImtpZCI6Ilg0dTJIdjRWeEw3N2JFOE45ZFQ0bHRWQm9Kc1NMVEg0YlkxYTVXTDZ3TlkifQ.eyJzdWIiOiJ0ZXN0X3VzZXIiLCJhdWQiOiJjb3J0ZXgiLCJpc3MiOiJjb2duaXRpdmVzY2FsZS5jb20iLCJpYXQiOjEyOTQ3NjU4NzEsImV4cCI6MTI5NDg1MjI3MX0.JyU-9ie7W_YlGxj76A2VQa2H9Ex_lE-KttQxV1wRLOCki48QvabDMmKsb3fDRMK0zoW_ZSpN7KlNU6S5a7lwBA';

        it('prints cortex env variables', async () => {
            await create().parseAsync(['node', 'configure', 'env', '--project', project]);
            const output = getPrintedLines()[0].split('\n');
            expect(output).to.length(totalVars);
            expect(output).to.include(`export CORTEX_TOKEN=${expectedToken}`);
            expect(output).to.include('export CORTEX_URI=http://localhost:8000');
            expect(output).to.include('export CORTEX_URL=http://localhost:8000');
            expect(output).to.include(`export CORTEX_PROJECT=${project}`);
            // default timeouts
            expect(output).to.include('#export CORTEX_TIMEOUT_LOOKUP=                              (default: 75, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_CONNECT=                             (default: 100, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_SECURE_CONNECT=                      (default: 100, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_SOCKET=                              (default: 1000, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_RESPONSE=                            (default: 2000, unit: ms)');
            expect(output).to.include('#export CORTEX_API_RETRY=                                   (default: 3)');
        });

        it('configure env does NOT pick up CORTEX_TOKEN & CORTEX_URI environment variables', async () => {
            // Token & URI are not picked from env variables, likely because
            // this command is meant to help the user configure their env based
            // on their profile.  Picking up env variables would be
            // inconsistent.
            process.env.CORTEX_TOKEN = 'asdf';
            process.env.CORTEX_URI = 'http://localhost:5000';
            await create().parseAsync(['node', 'configure', 'env', '--project', project]);
            const output = getPrintedLines()[0].split('\n');
            expect(output).to.length(totalVars);
            expect(output).to.include(`export CORTEX_PROJECT=${project}`);
            expect(output).to.include(`export CORTEX_TOKEN=${expectedToken}`);
            expect(output).to.include('export CORTEX_URI=http://localhost:8000');
            expect(output).to.include('export CORTEX_URL=http://localhost:8000');
            // default timeouts
            expect(output).to.include('#export CORTEX_TIMEOUT_LOOKUP=                              (default: 75, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_CONNECT=                             (default: 100, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_SECURE_CONNECT=                      (default: 100, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_SOCKET=                              (default: 1000, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_RESPONSE=                            (default: 2000, unit: ms)');
            expect(output).to.include('#export CORTEX_API_RETRY=                                   (default: 3)');
        });

        it('prints user defined timeout environment variables', async () => {
            process.env.CORTEX_API_RETRY = 0;
            process.env.CORTEX_TIMEOUT_LOOKUP = 100;
            process.env.CORTEX_TIMEOUT_CONNECT = 200;
            process.env.CORTEX_TIMEOUT_SECURE_CONNECT = 'false';
            process.env.CORTEX_TIMEOUT_SOCKET = 1000;
            process.env.CORTEX_TIMEOUT_RESPONSE = 2000;
            await create().parseAsync(['node', 'configure', 'env', '--project', project]);
            const output = getPrintedLines()[0].split('\n');
            expect(output).to.length(totalVars);
            expect(output).to.include(`export CORTEX_PROJECT=${project}`);
            expect(output).to.include(`export CORTEX_TOKEN=${expectedToken}`);
            expect(output).to.include('export CORTEX_URI=http://localhost:8000');
            expect(output).to.include('export CORTEX_URL=http://localhost:8000');
            // prints user defined variables
            expect(output).to.include('export CORTEX_TIMEOUT_LOOKUP=100                            # (unit: ms)');
            expect(output).to.include('export CORTEX_TIMEOUT_CONNECT=200                           # (unit: ms)');
            expect(output).to.include('export CORTEX_TIMEOUT_SECURE_CONNECT=false                  # (unit: ms)');
            expect(output).to.include('export CORTEX_TIMEOUT_SOCKET=1000                           # (unit: ms)');
            expect(output).to.include('export CORTEX_TIMEOUT_RESPONSE=2000                         # (unit: ms)');
            expect(output).to.include('export CORTEX_API_RETRY=0');
        });

        it('prints user defined timeout environment variables along with defaults', async () => {
            process.env.CORTEX_API_RETRY = 0;
            process.env.CORTEX_TIMEOUT_CONNECT = 200;
            process.env.CORTEX_TIMEOUT_SECURE_CONNECT = 'false';
            await create().parseAsync(['node', 'configure', 'env', '--project', project]);
            const output = getPrintedLines()[0].split('\n');
            expect(output).to.length(totalVars);
            expect(output).to.include(`export CORTEX_PROJECT=${project}`);
            expect(output).to.include(`export CORTEX_TOKEN=${expectedToken}`);
            expect(output).to.include('export CORTEX_URI=http://localhost:8000');
            expect(output).to.include('export CORTEX_URL=http://localhost:8000');
            // default timeouts
            expect(output).to.include('#export CORTEX_TIMEOUT_LOOKUP=                              (default: 75, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_SOCKET=                              (default: 1000, unit: ms)');
            expect(output).to.include('#export CORTEX_TIMEOUT_RESPONSE=                            (default: 2000, unit: ms)');
            // prints user defined variables
            expect(output).to.include('export CORTEX_TIMEOUT_CONNECT=200                           # (unit: ms)');
            expect(output).to.include('export CORTEX_TIMEOUT_SECURE_CONNECT=false                  # (unit: ms)');
            expect(output).to.include('export CORTEX_API_RETRY=0');
        });
    });
});
