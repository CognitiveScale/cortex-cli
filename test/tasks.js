import chai from 'chai';
import mockedEnv from 'mocked-env';
import nock from 'nock';
import _ from 'lodash';
import sinon from 'sinon';
import Tasks from '../src/client/tasks.js';
import {
    compatibilityApi, compatiblityResponse, infoApi, infoResponse, stripAnsi,
} from './utils.js';
import { create } from '../bin/cortex-tasks.js';

const { expect } = chai;
const PROJECT = 'project';
describe('Tasks', () => {
    let restoreEnv;
    let sandbox;
    let printSpy;
    let errorSpy;
    const serverUrl = 'http://localhost:8000';
    before(() => {
        if (!nock.isActive()) {
            nock.activate();
        }
        restoreEnv = mockedEnv({
            CORTEX_CONFIG_DIR: './test/cortex',
        });
        sandbox = sinon.createSandbox();
        sandbox.stub(process, 'exit').throws(Error('EXIT'));
        printSpy = sandbox.spy(console, 'log');
        errorSpy = sandbox.spy(console, 'error');
    });
    after(() => {
        restoreEnv();
        sandbox.restore();
        nock.restore();
    });
    beforeEach(() => {
        nock(serverUrl).get(compatibilityApi()).reply(200, compatiblityResponse());
        nock(serverUrl).persist().get(infoApi()).reply(200, infoResponse());
    });
    afterEach(() => {
        // clean up mocks that may not have been called
        nock.cleanAll();
    });
    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }
    function getErrorLines() {
        return _.flatten(errorSpy.args).map((s) => stripAnsi(s));
    }
    it('list tasks command (old response)', async () => {
        const response = { success: true, tasks: ['task0', 'task1'] };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await create().parseAsync(['node', 'tasks', 'list', '--project', PROJECT]);
        const output = getPrintedLines();
        const errs = getErrorLines();
        chai.expect(output.join('')).to.contain('task0');
        chai.expect(output.join('')).to.contain('task1');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
    });
    it('list tasks command JSON no tasks', async () => {
        const response = { success: true, tasks: [] };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await create().parseAsync(['node', 'tasks', 'list', '--project', PROJECT, '--json']);
        const output = getPrintedLines();
        const errs = getErrorLines();
        chai.expect(output.join('')).to.contain('No tasks found');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
    });
    it('list tasks command JSON without JSMEsearch', async () => {
        const response = { success: true, tasks: ['task0', 'task1'] };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await create().parseAsync(['node', 'tasks', 'list', '--project', PROJECT, '--json']);
        const output = getPrintedLines();
        const errs = getErrorLines();
        chai.expect(output.join('')).to.contain('name');
        chai.expect(output.join('')).to.contain('task0');
        chai.expect(output.join('')).to.contain('task1');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
    });
    it('list tasks command JSON with JSMEsearch', async () => {
        const now = Date.now();
        const response = {
            success: true,
            tasks: [
                {
                    name: 'task0', startTime: now - (30 * 60000), endTime: now - (10 * 60000), activationId: 'xxxxxx1', skillName: 'skill1', actionName: 'action1', status: 'COMPLETE',
                },
                {
                    name: 'task1', startTime: now - (40 * 60000), endTime: now - (10 * 60000), activationId: 'xxxxxx2', skillName: 'skill2', actionName: 'action1', status: 'FAIL',
                },
            ],
        };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await create().parseAsync(['node', 'tasks', 'list', '--project', PROJECT, '--json', '[].{skillName: skillName, name: name}']);
        const output = getPrintedLines();
        const errs = getErrorLines();
        chai.expect(output.join('')).to.not.contain('activationId');
        chai.expect(output.join('')).to.contain('skillName');
        chai.expect(output.join('')).to.contain('task0');
        chai.expect(output.join('')).to.contain('task1');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
    });
    it('list tasks command QUERY should work as JSON alias with JSMEsearch', async () => {
        const now = Date.now();
        const response = {
            success: true,
            tasks: [
                {
                    name: 'task0', startTime: now - (30 * 60000), endTime: now - (10 * 60000), activationId: 'xxxxxx1', skillName: 'skill1', actionName: 'action1', status: 'COMPLETE',
                },
                {
                    name: 'task1', startTime: now - (40 * 60000), endTime: now - (10 * 60000), activationId: 'xxxxxx2', skillName: 'skill2', actionName: 'action1', status: 'FAIL',
                },
            ],
        };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await create().parseAsync(['node', 'tasks', 'list', '--project', PROJECT, '--query', '[].{skillName: skillName, name: name}']);
        const output = getPrintedLines();
        const errs = getErrorLines();
        chai.expect(output.join('')).to.not.contain('activationId');
        chai.expect(output.join('')).to.contain('skillName');
        chai.expect(output.join('')).to.contain('task0');
        chai.expect(output.join('')).to.contain('task1');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
    });
    it('list tasks command', async () => {
        const now = Date.now();
        const response = {
            success: true,
            tasks: [
                {
                    name: 'task0', startTime: now - (30 * 60000), endTime: now - (10 * 60000), activationId: 'xxxxxx1', skillName: 'skill1', actionName: 'action1', status: 'COMPLETE',
                },
                {
                    name: 'task1', startTime: now - (40 * 60000), endTime: now - (10 * 60000), activationId: 'xxxxxx2', skillName: 'skill2', actionName: 'action1', status: 'FAIL',
                },
            ],
        };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await create().parseAsync(['node', 'tasks', 'list', '--project', PROJECT]);
        const output = getPrintedLines().join('');
        const errs = getErrorLines();
        chai.expect(output).to.contain('task0', output);
        chai.expect(output).to.contain('20 minutes', output);
        chai.expect(output).to.contain('30 minutes', output);
        chai.expect(output).to.contain('30 minutes ago', output);
        chai.expect(output).to.contain('40 minutes ago', output);
        chai.expect(output).to.contain('task0', output);
        chai.expect(output).to.contain('task1', output);
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
    });
    it('list tasks client JSON', async () => {
        const taskCtl = new Tasks(serverUrl);
        const options = {
            json: true,
        };
        const response = { success: true, tasks: ['task0', 'task1'] };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        const taskList = await taskCtl.listTasks(PROJECT, '', options);
        console.log(`taskList: ${JSON.stringify(taskList)}`);
        expect(taskList).to.deep.equal(response);
    });
});
