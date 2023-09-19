import chai from 'chai';
import mockedEnv from 'mocked-env';
import nock from 'nock';
import _ from 'lodash';
import sinon from 'sinon';
import { create } from '../bin/cortex-pipelines.js';
import { stripAnsi } from './utils.js';

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

  const serverUrl = 'http://localhost:4445';

  describe('Pipeline', () => {
    it('lists pipelines - empty', async () => {
      const response = { success: true, pipelines: [] };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipelines.*/).reply(200, response);
      create();
      await create().parseAsync(['node', 'pipelines', 'list', '--project', PROJECT]);
      
      const output = getPrintedLines();
      const errs = getErrorLines();
    //   eslint-disable-next-line no-unused-expressions
      chai.expect(errs.join('')).to.be.empty;
      chai.expect(output.join('')).to.contain('No pipelines found');
      nock.isDone();
    });

    it('lists pipelines', async () => {
      const response = {
        success: true,
        pipelines: [
          { name: 'pipeline1', gitRepoName: 'repo1', sha: 'qwerty' },
          { name: 'pipeline2', gitRepoName: 'repo2', sha: 'abcd' },
        ],
      };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipelines.*/).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'list', '--project', PROJECT]);
      const output = getPrintedLines().join('');
      const errs = getErrorLines().join('');
      chai.expect(output).to.contain('pipeline1');
      chai.expect(output).to.contain('qwerty');
      chai.expect(output).to.contain('pipeline2');
      chai.expect(output).to.contain('qwerty');
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });

    it('describes a pipeline', async () => {
      const response = {
        success: true,
        pipeline: {
          name: 'pipeline1',
          sha: 'qwerty',
          gitRepoName: 'repo1',
          _projectId: PROJECT,
          deleted: false,
          version: 1,
        },
      };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipelines\/.*/).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'describe', 'pipeline1', 'repo1', '--project', PROJECT]);
      const output = getPrintedLines().join('');
      const errs = getErrorLines().join('');
      const description = JSON.parse(output);
      chai.expect(description).to.deep.equal(response.pipeline);
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });

    it('describes a non-existent pipeline', async () => {
      const response = {
        success: false,
        message: 'pipeline with name nonExistentPipeline not found',
        status: 404,
      };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipelines\/.*/).reply(404, response);
      try {
        await create().parseAsync(['node', 'pipelines', 'describe', 'nonExistentPipeline', 'repo1', '--project', PROJECT]);
      } catch (err) {
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(output).to.be.empty;
        chai.expect(errs).to.contain('Failed to describe pipeline: 404 pipeline with name nonExistentPipeline not found');
        nock.isDone();
      }
    });
  });
});
