import chai from 'chai';
import mockedEnv from 'mocked-env';
import nock from 'nock';
import _ from 'lodash';
import sinon from 'sinon';
import yaml from 'js-yaml';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { create } from '../bin/cortex-pipelines-repos.js';
import {
  infoApi, infoResponse, compatibilityApi, compatiblityResponse, stripAnsi,
} from './utils.js';

const PROJECT = 'project';

describe('Pipelines', () => {
  let restoreEnv;
  let sandbox;
  let printSpy;
  let errorSpy;
  const serverUrl = 'http://localhost:8000';
  const exampleRepo = 'git@github.com:organization/repository-name.git';
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

  describe('Pipeline Repos', () => {
    describe('#List Repos', () => {
      it('lists pipeline repositories - empty', async () => {
        const response = { success: true, pipelineRepositories: [] };
        nock(serverUrl).get(/\/fabric\/v4\/projects\/.*\/pipeline-repositories/).reply(200, response);
        await create().parseAsync(['node', 'repos', 'list', '--project', PROJECT]);
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
        await create().parseAsync(['node', 'repos', 'list', '--project', PROJECT, '--json']);
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
        await create().parseAsync(['node', 'repos', 'list', '--project', PROJECT]);
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
      await create().parseAsync(['node', 'repos', 'describe', 'repo1', '--project', PROJECT]);
      const output = getPrintedLines().join('');
      const errs = getErrorLines().join('');
      const description = JSON.parse(output);
      chai.expect(description).to.deep.equal(response.pipelineRepository);
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });

    describe('#Save Pipeline Repo', () => {
      it('saves a pipeline repository (json)', async () => {
        const repo = {
          name: 'repo1',
          repo: exampleRepo,
          branch: 'develop',
        };
        const response = {
          success: true,
          version: 1,
          message: 'pipelineRepository repo1 saved.',
        };
        // save definition of 'repo' to temporary file
        const dir = await mkdtemp(join(tmpdir(), 'tmp-'));
        const filename = join(dir, 'repo1.json');
        await writeFile(filename, JSON.stringify(repo));
        // invoke the CLI
        nock(serverUrl).post(/\/fabric\/v4\/projects\/.*\/pipeline-repositories/).reply(200, response);
        await create().parseAsync(['node', 'repos', 'save', filename, '--project', PROJECT]);
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        // verify response
        chai.expect(output).to.contain('Pipeline Repository saved');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
      });

      it('saves a pipeline repository (yaml)', async () => {
        const repo = {
          name: 'repo1',
          repo: exampleRepo,
          branch: 'develop',
        };
        const response = {
          success: true,
          version: 1,
          message: 'pipelineRepository repo1 saved.',
        };
        // save definition of 'repo' to temporary file
        const dir = await mkdtemp(join(tmpdir(), 'tmp-'));
        const filename = join(dir, 'repo1.yaml');
        await writeFile(filename, yaml.dump(repo));
        // invoke the CLI
        nock(serverUrl).post(/\/fabric\/v4\/projects\/.*\/pipeline-repositories/).reply(200, response);
        await create().parseAsync(['node', 'repos', 'save', '-y', filename, '--project', PROJECT]);
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        // verify response
        chai.expect(output).to.contain('Pipeline Repository saved');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
      });

      it('saves a pipeline repository using CLI flags', async () => {
        const response = {
          success: true,
          version: 1,
          message: 'pipelineRepository testpipeline saved.',
        };
        // invoke the CLI
        nock(serverUrl).post(/\/fabric\/v4\/projects\/.*\/pipeline-repositories/).reply(200, response);
        await create().parseAsync(['node', 'repos', 'save', '--name', 'testpipeline', '--branch', 'develop', '--repo', 'mc://test.key', '--project', PROJECT]);
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        // verify response
        chai.expect(output).to.contain('Pipeline Repository saved');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
      });
    });

    it('deletes a pipeline repository', async () => {
      const response = {
        success: true,
        message: 'Successfully deleted pipelineRepository repo1',
      };
      nock(serverUrl).delete(/\/fabric\/v4\/projects\/.*\/pipeline-repositories\/.*/).reply(200, response);
      await create().parseAsync(['node', 'repos', 'delete', 'repo1', '--project', PROJECT]);
      const output = getPrintedLines().join('');
      const errs = getErrorLines().join('');
      chai.expect(output).to.contain(response.message);
      // eslint-disable-next-line no-unused-expressions
      chai.expect(errs).to.be.empty;
      nock.isDone();
    });

    it('fails to delete a pipeline repository  ', async () => {
      const response = {
        success: false,
        message: 'Failed to delete pipelineRepository repo1',
        status: 503,
      };
      nock(serverUrl).delete(/\/fabric\/v4\/projects\/.*\/pipeline-repositories\/.*/).reply(200, response);
      try {
        await create().parseAsync(['node', 'repos', 'delete', 'repo1', '--project', PROJECT]);
      } catch (err) {
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(output).to.be.empty;
        chai.expect(errs).to.contain('Pipeline Repository deletion failed: 503 Failed to delete pipelineRepository repo1.');
        nock.isDone();
      }
    });

    describe('#Update Pipelines', () => {
      it('should update-pipelines - all success', async () => {
        const response = {
          message: 'All Pipelines updated successfully!',
          code: 200,
          success: true,
          updateReport: {
            added: ['pipeline1', 'pipeline4'],
            updated: ['pipeline2'],
            deleted: ['pipeline3'],
            failed: {
              add: [],
              delete: [],
              update: [],
            },
          },
        };
        nock(serverUrl).post(/\/fabric\/v4\/projects\/.*\/pipeline-repositories\/.*\/update/).reply(200, response);
        await create().parseAsync(['node', 'repos', 'update-pipelines', 'repo1', '--project', PROJECT]);
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(output).to.equal(
          `${response.message}\n`
          + '┌────────────────────┬─────────────────────────┬──────────────────────────────┐\n'
          + '│                    │ Pipeline Name           │ Details                      │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ pipeline1               │                              │\n'
          + '│       Added        ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ pipeline4               │                              │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│      Updated       │ pipeline2               │                              │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│      Deleted       │ pipeline3               │                              │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│   Failed to Add    │ -                       │ -                            │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│  Failed to Update  │ -                       │ -                            │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│  Failed to Delete  │ -                       │ -                            │\n'
          + '└────────────────────┴─────────────────────────┴──────────────────────────────┘',
        );
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
      });

      it('should update-pipelines with custom Skill', async () => {
        const response = {
          success: true,
          code: 200,
          message: 'All Pipelines updated successfully!',
          updateReport: {
            added: ['pipeline1'],
            updated: ['pipeline2'],
            deleted: ['pipeline3'],
            failed: {
              add: [],
              delete: [],
              update: [],
            },
          },
        };

        nock(serverUrl)
          .post(/\/fabric\/v4\/projects\/.*\/pipeline-repositories\/.*\/update/)
          .query({ skillName: 'my-skill' })
          .reply(200, response);
        await create().parseAsync(['node', 'repos', 'update-pipelines', 'repo1', '--project', PROJECT, '--skill', 'my-skill']);
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        chai.expect(output).to.equal(
          `${response.message}\n`
          + '┌────────────────────┬─────────────────────────┬──────────────────────────────┐\n'
          + '│                    │ Pipeline Name           │ Details                      │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│       Added        │ pipeline1               │                              │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│      Updated       │ pipeline2               │                              │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│      Deleted       │ pipeline3               │                              │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│   Failed to Add    │ -                       │ -                            │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│  Failed to Update  │ -                       │ -                            │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│  Failed to Delete  │ -                       │ -                            │\n'
          + '└────────────────────┴─────────────────────────┴──────────────────────────────┘',
        );
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
      });

      it('should report no changes when updating-pipelines with an empty report', async () => {
        // set up mock - should report no changes, but it was successful
        const response = {
          success: true,
          updateReport: {
            added: [],
            updated: [],
            deleted: [],
            failed: {
              add: [],
              delete: [],
              update: [],
            },
          },
        };
        nock(serverUrl)
          .post(/\/fabric\/v4\/projects\/.*\/pipeline-repositories\/.*\/update/)
          .reply(200, response);

        // Execute update
        await create().parseAsync(['node', 'repos', 'update-pipelines', 'repo1', '--project', PROJECT]);
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        chai.expect(output).to.equal('Pipelines up to date! No changes made.');
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.be.empty;
        nock.isDone();
      });

      it('should report pipeline failures and error details in the error message', async () => {
        // set up mock - should report no changes, but it was successful
        const response = {
          success: false,
          code: 200,
          message: 'Individual Pipeline(s) failed to be updated! Check the Pipeline Update Report.',
          updateReport: {
            added: [
              'hello_world',
              'ingest_lookup',
              'medallion-s3',
              'simple',
              'skill_test',
            ],
            updated: [],
            deleted: [],
            failed: {
              add: [
                {
                  pipelineName: 'error-invalid-config1',
                  details: 'Failed to parse Pipeline Configuration. Error: Invalid value for spec.blocks. At least 1 block is required',
                },
                {
                  pipelineName: 'error-invalid-config2',
                  details: 'Failed to parse Pipeline Configuration. Error: Invalid value for key "type" on BlockConfig. Expected one of [dbt, streaming] but got "invalid-custom"',
                },
                {
                  pipelineName: 'error-invalid-config3',
                  details: 'Failed to parse Pipeline Configuration. Error: Invalid value for key "apiVersion" on PipelineConfig. Expected string but got undefined',
                },
                {
                  pipelineName: 'error-invalid-config4',
                  details: 'Failed to parse Pipeline Configuration. Error: Invalid value for key "executor" on BlockConfig. Expected one of [pyspark] but got undefined',
                },
                {
                  pipelineName: 'error-invalid-config5',
                  details: 'Failed to parse Pipeline Configuration. SyntaxError: Unexpected token H in JSON at position 0',
                },
                {
                  pipelineName: 'error-multiple-config',
                  details: 'Multiple config files found',
                },
                {
                  pipelineName: 'error-no-config',
                  details: 'Config file not found',
                },
              ],
              update: [],
              delete: [],
            },
          },
        };
        nock(serverUrl)
          .post(/\/fabric\/v4\/projects\/.*\/pipeline-repositories\/.*\/update/)
          .reply(200, response);

        // Execute update
        await create().parseAsync(['node', 'repos', 'update-pipelines', 'repo1', '--project', PROJECT]);
        const output = getPrintedLines().join('');
        const errs = getErrorLines().join('');
        chai.expect(output).to.equal(
          '┌────────────────────┬─────────────────────────┬──────────────────────────────┐\n'
          + '│                    │ Pipeline Name           │ Details                      │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ hello_world             │                              │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ ingest_lookup           │                              │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│       Added        │ medallion-s3            │                              │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ simple                  │                              │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ skill_test              │                              │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│      Updated       │ -                       │ -                            │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│      Deleted       │ -                       │ -                            │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ error-invalid-config1   │ Failed to parse Pipeline     │\n'
          + '│                    │                         │ Configuration. Error:        │\n'
          + '│                    │                         │ Invalid value for            │\n'
          + '│                    │                         │ spec.blocks. At least 1      │\n'
          + '│                    │                         │ block is required            │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ error-invalid-config2   │ Failed to parse Pipeline     │\n'
          + '│                    │                         │ Configuration. Error:        │\n'
          + '│                    │                         │ Invalid value for key "type" │\n'
          + '│                    │                         │ on BlockConfig. Expected one │\n'
          + '│                    │                         │ of [dbt, streaming] but got  │\n'
          + '│                    │                         │ "invalid-custom"             │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ error-invalid-config3   │ Failed to parse Pipeline     │\n'
          + '│                    │                         │ Configuration. Error:        │\n'
          + '│                    │                         │ Invalid value for key        │\n'
          + '│                    │                         │ "apiVersion" on              │\n'
          + '│   Failed to Add    │                         │ PipelineConfig. Expected     │\n'
          + '│                    │                         │ string but got undefined     │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ error-invalid-config4   │ Failed to parse Pipeline     │\n'
          + '│                    │                         │ Configuration. Error:        │\n'
          + '│                    │                         │ Invalid value for key        │\n'
          + '│                    │                         │ "executor" on BlockConfig.   │\n'
          + '│                    │                         │ Expected one of [pyspark]    │\n'
          + '│                    │                         │ but got undefined            │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ error-invalid-config5   │ Failed to parse Pipeline     │\n'
          + '│                    │                         │ Configuration. SyntaxError:  │\n'
          + '│                    │                         │ Unexpected token H in JSON   │\n'
          + '│                    │                         │ at position 0                │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ error-multiple-config   │ Multiple config files found  │\n'
          + '│                    ├─────────────────────────┼──────────────────────────────┤\n'
          + '│                    │ error-no-config         │ Config file not found        │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│  Failed to Update  │ -                       │ -                            │\n'
          + '├────────────────────┼─────────────────────────┼──────────────────────────────┤\n'
          + '│  Failed to Delete  │ -                       │ -                            │\n'
          + '└────────────────────┴─────────────────────────┴──────────────────────────────┘',
        );
        // eslint-disable-next-line no-unused-expressions
        chai.expect(errs).to.equal(`${response.message}\n`);
        nock.isDone();
      });
    });
  });
});
