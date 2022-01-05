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
const chai = require('chai');
const mockedEnv = require('mocked-env');
const nock = require('nock');
const {
    ListTasksCommand,
    // DescribeTaskCommand,
    // TaskLogsCommand,
    // TaskDeleteCommand
} = require('../src/commands/tasks');
const Tasks = require('../src/client/tasks');

const { expect } = chai;
let restoreEnv;
describe('Tasks', () => {
    before(() => {
        restoreEnv = mockedEnv({
            CORTEX_CONFIG_DIR: './test/cortex',
        });
        nock.activate();
    });
    after(() => {
        restoreEnv();
        nock.restore();
    });

    afterEach(() => {
        // clean up mocks that may not have been called
        nock.cleanAll();
    });

    const serverUrl = 'http://localhost:8000';

    // this isn't the best way to test these commands.. might need to do a larger refactor
    xit('list tasks command', async () => {
        const program = new commander.Command();
        const command = new ListTasksCommand(program);
        const project = 'test';
        const options = {
            project,
            json: true,
        };

        const requestPath = `/fabric/v4/projects/${project}/tasks?project=${project}&json=true`;
        const response = { success: true, tasks: ['task0', 'task1'] };
        nock(serverUrl).get(requestPath).reply(200, response);
        let body;
        await command.execute(options)
            .then((output) => {
                console.log(`output: ${JSON.stringify(output)}`);
                body = output;
                nock.isDone();
            });
        console.log(`after await ${JSON.stringify(body)}`);
        nock.isDone();
    });

    it('list tasks client', async () => {
        const taskCtl = new Tasks('http://127.0.0.1:8000');
        const project = 'test';
        const options = {
            project,
            json: true,
        };

        const requestPath = `/fabric/v4/projects/${project}/tasks?project=${project}&json=true`;
        const response = { success: true, tasks: ['task0', 'task1'] };
        nock('http://127.0.0.1:8000').get(requestPath).reply(200, response);
        const taskList = await taskCtl.listTasks(project, '', options);
        console.log(`taskList: ${JSON.stringify(taskList)}`);
        expect(taskList).to.deep.equal(response);
    });
});
