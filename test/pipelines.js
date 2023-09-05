import chai from 'chai';
import mockedEnv from 'mocked-env';
import nock from 'nock';
import _ from 'lodash';
import sinon from 'sinon';
import { stripAnsi } from './utils.js';
import { create } from '../bin/cortex-pipelines.js';

// import Pipelines from '../src/client/pipelines.js';
// const { expect } = chai;
const PROJECT = 'project';

describe('Pipelines', () => {
  let restoreEnv;
  let sandbox;
  let printSpy;
  let errorSpy;
  beforeEach(() => {
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

  afterEach(() => {
    // clean up mocks that may not have been called
    restoreEnv();
    nock.cleanAll();
    sandbox.restore();
  });

  function getPrintedLines() {
    return _.flatten(printSpy.args).map((s) => stripAnsi(s));
  }
  function getErrorLines() {
      return _.flatten(errorSpy.args).map((s) => stripAnsi(s));
  }

  const serverUrl = 'http://localhost:8000';
  const exampleRepo = 'git@github.com:organization/repository-name.git';

  describe('Pipeline Repos', () => {
    it('lists pipeline repositories - empty', async () => {
      const response = { success: true, pipelineRepositories: [] };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipeline-repositories/).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'repos', 'list', '--project', PROJECT]);
      const output = getPrintedLines();
      const errs = getErrorLines();
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs.join('')).to.be.empty;
      chai.expect(output.join('')).to.contain('No pipeline repositories found');
      nock.isDone();
    });

    it('lists pipeline repositories as JSON - empty', async () => {
      const response = { success: true, pipelineRepositories: [] };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipeline-repositories/).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'repos', 'list', '--project', PROJECT, '--json']);
      const output = getPrintedLines();
      const errs = getErrorLines();
      const roundTripped = JSON.parse(output.join(''));
      // eslint-disable-next-line no-unused-expressions
      chai.expect(roundTripped).to.be.an('array').that.is.empty;
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs.join('')).to.be.empty;
      nock.isDone();
    });

    it('lists pipeline repositories', async () => {
      const response = {
        success: true,
        pipelineRepositories: [
          { name: 'repo1', repo: exampleRepo, branch: 'main' },
          { name: 'repo2', repo: exampleRepo, branch: 'develop' },
        ],
      };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipeline-repositories.*/).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'repos', 'list', '--project', PROJECT]);
      const output = getPrintedLines().join('');
      const errs = getErrorLines().join('');
      chai.expect(output).to.contain('repo1');
      chai.expect(output).to.contain('main');
      chai.expect(output).to.contain('repo2');
      chai.expect(output).to.contain('develop');
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });

    it('describes a pipeline repository  ', async () => {
      const response = {
        success: true,
        pipelineRepository: {
          name: 'repo1',
          repo: exampleRepo,
          branch: 'develop',
          _projectId: PROJECT,
          deleted: false,
          version: 1,
        },
      };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipeline-repositories\/.*/).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'repos', 'describe', 'repo1', '--project', PROJECT]);
      const output = getPrintedLines().join('');
      const errs = getErrorLines().join('');
      const description = JSON.parse(output);
      chai.expect(description).to.deep.equal(response.pipelineRepository);
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });

    // it('saves a pipeline repository  ', async () => {
    // });

    // it('deletes a pipeline repository  ', async () => {
    // });
  });
});
