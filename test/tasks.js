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
const nock = require('nock');
const _ = require('lodash');
const sinon = require('sinon');
const Tasks = require('../src/client/tasks');
const { stripAnsi } = require('./utils');

const { expect } = chai;

const PROJECT = 'project';
describe('Tasks', () => {
    let restoreEnv;
    let sandbox;
    let printSpy;
    let errorSpy;
    before(() => {
        if (!nock.isActive()) {
            nock.activate();
        }
        restoreEnv = mockedEnv({
            CORTEX_CONFIG_DIR: './test/cortex',
        });
        sandbox = sinon.createSandbox();
        printSpy = sandbox.spy(console, 'log');
        errorSpy = sandbox.spy(console, 'error');
    });

    beforeEach(() => {
        delete require.cache[require.resolve('commander')];
        delete require.cache[require.resolve('../bin/cortex-tasks')];
    });

    after(() => {
        restoreEnv();
        sandbox.restore();
        nock.restore();
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

    const serverUrl = 'http://localhost:8000';

    it('list tasks command (old response)', async () => {
        const program = require('../bin/cortex-tasks');
        const response = { success: true, tasks: ['task0', 'task1'] };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await program.parseAsync(['node', 'tasks', 'list', '--project', PROJECT]);
        const output = getPrintedLines();
        const errs = getErrorLines();
        chai.expect(output.join('')).to.contain('task0');
        chai.expect(output.join('')).to.contain('task1');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
    });

    it('list tasks command JSON no tasks', async () => {
        const program = require('../bin/cortex-tasks');
        const response = { success: true, tasks: [] };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await program.parseAsync(['node', 'tasks', 'list', '--project', PROJECT, '--json']);
        const output = getPrintedLines();
        const errs = getErrorLines();
        chai.expect(output.join('')).to.contain('No tasks found');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
    });

    it('list tasks command JSON without JSMEsearch', async () => {
        const program = require('../bin/cortex-tasks');
        const response = { success: true, tasks: ['task0', 'task1'] };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/tasks.*/).reply(200, response);
        await program.parseAsync(['node', 'tasks', 'list', '--project', PROJECT, '--json']);
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
        const program = require('../bin/cortex-tasks');
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
        await program.parseAsync(['node', 'tasks', 'list', '--project', PROJECT, '--json', '[].{skillName: skillName, name: name}']);
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
        const program = require('../bin/cortex-tasks');
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
        await program.parseAsync(['node', 'tasks', 'list', '--project', PROJECT, '--query', '[].{skillName: skillName, name: name}']);
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
        const program = require('../bin/cortex-tasks');
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
        await program.parseAsync(['node', 'tasks', 'list', '--project', PROJECT]);
        const output = getPrintedLines();
        const errs = getErrorLines();
        chai.expect(output.join('')).to.contain('task0');
        chai.expect(output.join('')).to.contain('20 minutes');
        chai.expect(output.join('')).to.contain('30 minutes');
        chai.expect(output.join('')).to.contain('30 minutes ago');
        chai.expect(output.join('')).to.contain('40 minutes ago');
        chai.expect(output.join('')).to.contain('task0');
        chai.expect(output.join('')).to.contain('task1');
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
