import chai from 'chai';
import mockedEnv from 'mocked-env';
import _ from 'lodash';
import sinon from 'sinon';
import fs from 'fs';
import nock from 'nock';
import isCI from 'is-ci';
import { stripAnsi } from './utils.js';
import { create } from '../bin/cortex-workspaces.js';
import * as wsutils from '../src/commands/workspaces/workspace-utils.js';

describe('Workspaces', () => {
    let restoreEnv;
    let sandbox;
    let printSpy;
    let errorSpy;
    before(() => {
        if (!nock.isActive()) {
            nock.activate();
        }
        restoreEnv = mockedEnv({
            CORTEX_CONFIG_DIR: '../cortex',
        });
        sandbox = sinon.createSandbox();
        printSpy = sandbox.spy(console, 'log');
        errorSpy = sandbox.spy(console, 'error');
        fs.mkdirSync('test/workspaces', { recursive: true });
        process.chdir('test/workspaces');
    });
    // beforeEach(() => {
    //     delete require.cache[require.resolve('commander')];
    //     delete require.cache[require.resolve('../bin/cortex-workspaces')];
    // });
    after(() => {
        restoreEnv();
        sandbox.restore();
        process.chdir('..');
        nock.cleanAll();
        fs.rmSync('cortex/cache.dat');
        fs.rmSync('workspaces', { recursive: true });
    });
    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }
    function getErrorLines() {
        return _.flatten(errorSpy.args).map((s) => stripAnsi(s));
    }
    it('headless workspace persist token', async () => {
        nock('https://api.github.com')
            .get('/user').reply(200, { statusCode: 200 });
        // test that headless token storage works ...
        const tokenToStore = { token_type: 'token_type', access_token: 'access_token' };
        await wsutils.persistToken(tokenToStore);
        const token = await wsutils.validateToken();
        chai.expect(token).equal(`${tokenToStore.token_type} ${tokenToStore.access_token}`);
    });
    // eslint-disable-next-line func-names
    xit('should generate a job skill', async () => {
        if (!isCI) {
            await create().parseAsync(['node', 'workspaces', 'generate', 'job1', '--notree', '--template', 'Custom Job Skill']);
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
        } else {
            this.skip();
        }
    });
    // eslint-disable-next-line func-names
    xit('should generate a daemon skill', async function () {
        if (!isCI) {
            await create().parseAsync(['node', 'workspaces', 'generate', 'dmn1', '--notree', '--template', 'Custom Daemon Skill']);
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
        } else {
            this.skip();
        }
    });
});
