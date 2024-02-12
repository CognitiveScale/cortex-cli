import chai from 'chai';
import mockedEnv from 'mocked-env';
import nock from 'nock';
import _ from 'lodash';
import sinon from 'sinon';
import { create } from '../bin/cortex-pipelines.js';
import {
  compatibilityApi, compatiblityResponse, infoApi, infoResponse, stripAnsi,
} from './utils.js';

const PROJECT = 'project';

describe('Pipelines', () => {
  let restoreEnv;
  let sandbox;
  let printSpy;
  let errorSpy;
  let warnSpy;
  const serverUrl = 'http://localhost:8000';
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
    warnSpy = sandbox.spy(console, 'warn');
    nock(serverUrl).get(compatibilityApi()).reply(200, compatiblityResponse());
    nock(serverUrl).persist().get(infoApi()).reply(200, infoResponse());
    process.env.PREVIEW_FEATURES_ENABLED = '1';
  });

  afterEach(() => {
    // clean up mocks that may not have been called
    restoreEnv();
    nock.cleanAll();
    sandbox.restore();
    delete process.env.PREVIEW_FEATURES_ENABLED;
  });

  function getPrintedLines() {
    return _.flatten(printSpy.args).map((s) => stripAnsi(s));
  }

  function getErrorLines() {
      return _.flatten(errorSpy.args).map((s) => stripAnsi(s));
  }

  function getWarningLines() {
    return _.flatten(warnSpy.args).map((s) => stripAnsi(s));
  }

  describe('List Pipelines as an unsupported preview feature', () => {
    it('should print that the response was unintelligable', async () => {
      const response = '<html></html>';
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipelines/).reply(200, response, { 'content-type': 'text/html' });
      try {
        await create().parseAsync(['node', 'pipelines', 'list', '--project', PROJECT]);
        chai.expect(0).to.equal(1, 'Failure expected!'); // because 'EXIT' signal is mocked with Error
      } catch {
        const output = getPrintedLines();
        const errs = getErrorLines();
        // eslint-disable-next-line no-unused-expressions
        chai.expect(output.join('')).to.be.empty;
        chai.expect(errs.join('')).to.contain('Unable to parse response from server. Try running again with "--debug" for more details.');
        nock.isDone();
      }
    });
  });

  describe('Pipeline', () => {
    describe('#ListPipelines', () => {
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

      it('lists pipelines in a repo', async () => {
        const response = {
          success: true,
          pipelines: [
            { name: 'pipeline1', gitRepoName: 'repo1', sha: 'qwerty' },
            { name: 'pipeline2', gitRepoName: 'repo1', sha: 'abcd' },
          ],
        };
        // NOTE: '--repo' is a shortcut for '--filter', and all query params are
        // required by nock for the match to be succesful
        nock(serverUrl)
          .get(/\/fabric\/v4\/projects\/.*\/pipelines.*/)
          .query({
            filter: JSON.stringify({ gitRepoName: 'repo1' }),
            limit: 20,
            sort: JSON.stringify({ updatedAt: -1 }),
            skip: 0,
          }).reply(200, response);
        await create().parseAsync(['node', 'pipelines', 'list', '--project', PROJECT, '--repo', 'repo1']);
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

      it('warns that --filter has a higher priority that --repo when listing pipelines', async () => {
        const response = {
          success: true,
          pipelines: [
            { name: 'pipeline1', gitRepoName: 'repo1', sha: 'qwerty' },
            { name: 'pipeline2', gitRepoName: 'repo1', sha: 'abcd' },
          ],
        };
        nock(serverUrl)
          .get(/\/fabric\/v4\/projects\/.*\/pipelines/)
          .query({
            filter: JSON.stringify({ name: 'pipeline' }), // matches --filter
            limit: 20,
            sort: JSON.stringify({ updatedAt: -1 }),
            skip: 0,
          })
          .reply(200, response);
        await create().parseAsync(['node', 'pipelines', 'list', '--project', PROJECT, '--repo', 'repo1', '--filter', '{"name":"pipeline"}']);
        const output = getPrintedLines().join('');
        const warn = getWarningLines().join('');
        const errs = getErrorLines().join('');
        chai.expect(output).to.contain('pipeline1');
        chai.expect(output).to.contain('qwerty');
        chai.expect(output).to.contain('pipeline2');
        chai.expect(output).to.contain('qwerty');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        chai.expect(warn).to.contain('WARNING: --repo and --filter options are incompatible! The --filter option will be used');
        nock.isDone();
      });
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

    xit('trigger pipeline run', async () => {
      const response = {
        success: true,
        activationId: '3d77f2d3-90ef-4061-a17d-fa2aecb3c6a4',
      };
      nock(serverUrl).post(/\/fabric\/v4\/projects\/.*\/pipelines\/.*\/run/).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'run', 'pipeline1', 'repo1', '--project', PROJECT]);
      const output = getPrintedLines().join('');
      const errs = getErrorLines().join('');
      const description = JSON.parse(output);
      chai.expect(description).to.deep.equal(response);
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });

    xit('list pipeline runs', async () => {
      const response = {
        success: true,
        activations: [
            {
                activationId: '4ea4199-1590-46ca-b49d-2f2574ef5873',
                status: 'COMPLETE',
                start: 1696875227868,
                end: 1696875239664,
                agentName: 'toy-pipeline',
            },
          ],
      };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipelines\/.*\/run/).query({ gitRepoName: 'repo1' }).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'list-runs', 'pipeline1', 'repo1', '--project', PROJECT]);
      const errs = getErrorLines().join('');
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });

    xit('describe pipeline run', async () => {
      const response = {
        success: true,
        agentName: 'toy-pipeline',
        channelId: 'd9e97efc-c663-43e7-a435-2b85d6977d1c',
        payload: {
            config: '/app/conf/spark-conf-sensa-data-pipeline.json',
            app_command: [
                '--var',
                'key=value',
                '--pipeline',
                'claro_pipeline',
                '--config',
                'config_catalog.yml',
                '.',
                '--repo',
                'git@github.com:CognitiveScale/sensa-data-pipelines.git',
                '--block',
                'someblock',
            ],
        },
        projectId: 'mc-test',
        requestId: '54ea4199-1590-46ca-b49d-2f2574ef5873',
        serviceName: 'input',
        sessionId: '54ea4199-1590-46ca-b49d-2f2574ef5873',
        sync: false,
        timestamp: 1696875227736,
        token: 'eyJhbGciOiJxm_K3fAA',
        username: 'cortex@example.com',
        start: 1696875227868,
        status: 'COMPLETE',
        end: 1696875239664,
        response: {},
      };
      nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipelines\/.*\/run\/.*/).query({ gitRepoName: 'repo1' }).reply(200, response);
      await create().parseAsync(['node', 'pipelines', 'describe-run', 'pipeline1', 'repo1', 'd9e97efc-c663-43e7-a435-2b85d6977d1c', '--project', PROJECT]);
      const errs = getErrorLines().join('');
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });
  });
});
