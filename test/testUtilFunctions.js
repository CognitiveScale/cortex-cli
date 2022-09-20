const { expect } = require('chai');
const _ = require('lodash');
const mockedEnv = require('mocked-env');
const sinon = require('sinon');
const { getQueryOptions, getFilteredOutput } = require('../src/commands/utils');

const { stripAnsi } = require('./utils');

describe('Test getQueryOptions function', () => {
    it('should have empty query string if options.json is true', () => {
        const options = {
            json: true,
        };
        const queryOptions = getQueryOptions(options);
        expect(queryOptions.query).to.eql(null);
    });

    it('should retain the query string if options.json is not true', () => {
        const queryPath = '[].{name: name, title: title}';
        const options = {
            json: queryPath,
        };
        const queryOptions = getQueryOptions(options);
        expect(queryOptions.query).to.eql(queryPath);
    });

    // TODO remove --query on deprecation
    // handle cases 'cortex entity command --query <path> --json'
    it('--query [arg] should override --json [arg] the if both are passed', () => {
        const queryPath = '[].{name: name, title: title}';
        const jsonPath = '[].{name: name}';
        const options = {
            json: jsonPath,
            query: queryPath,
        };
        const queryOptions = getQueryOptions(options);
        expect(queryOptions.query).to.eql(queryPath);
    });
});

describe('Test getFilteredOutput function', () => {
    let restore;
    let printSpy;
    let printSpyConsole;
    before(() => {
        restore = mockedEnv({});
    });

    beforeEach(() => {
        printSpy = sinon.spy(process.stderr, 'write');
        printSpyConsole = sinon.spy(console, 'log');
    });

    afterEach(() => {
        printSpy.restore();
        printSpyConsole.restore();
    });

    after(() => {
        restore();
    });

    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }

    function getPrintedConsoleLines() {
        return _.flatten(printSpyConsole.args).map((s) => stripAnsi(s));
    }

    it('should print Deprecation warning when query option is present', () => {
        const queryPath = '[].{name: name, title: title}';
        const options = {
            query: queryPath,
        };
        getFilteredOutput([], options);
        expect(getPrintedLines()).to.eql(['[DEPRECATION WARNING] --query\n']);
    });

    it('should print error message when query has invalid input', () => {
        // handle cases 'cortex entity command --query <path> --json'
        const queryPath = '--json';
        const options = {
            query: queryPath,
        };
        getFilteredOutput([], options);
        expect(getPrintedLines()[1]).to.eql(`error: invalid argument: ${queryPath} \n`);
    });

    it('should print json output with correct params', () => {
        // handle cases 'cortex entity command --query <path> --json'
        const options = {
            json: true,
        };
        const data = { name: 'test-name', title: 'test-title' };
        getFilteredOutput(data, options);
        expect(getPrintedConsoleLines()[0]).to.contain('name');
        expect(getPrintedConsoleLines()[0]).to.contain('test-name');
        expect(getPrintedConsoleLines()[0]).to.contain('title');
        expect(getPrintedConsoleLines()[0]).to.contain('test-title');
    });

    it('should print json output with correct query args', () => {
        const options = {
            query: 'title',
        };
        const data = { name: 'test-name', title: 'test-title' };
        getFilteredOutput(data, options);
        expect(getPrintedLines()[0]).to.contain(['[DEPRECATION WARNING] --query']);
        expect(getPrintedConsoleLines()[0]).to.not.contain('name');
        expect(getPrintedConsoleLines()[0]).to.not.contain('test-name');
        expect(getPrintedConsoleLines()[0]).to.contain('test-title');
    });

    it('should print json output with correct json args without Deprecation warning', () => {
        const options = {
            json: 'title',
        };
        const data = { name: 'test-name', title: 'test-title' };
        getFilteredOutput(data, options);
        expect(getPrintedLines()).to.not.contain(['[DEPRECATION WARNING] --query']);
        expect(getPrintedConsoleLines()[0]).to.not.contain('name');
        expect(getPrintedConsoleLines()[0]).to.not.contain('test-name');
        expect(getPrintedConsoleLines()[0]).to.contain('test-title');
    });

    it('should override json path when both query and json path are passed', () => {
        const options = {
            json: 'title',
            query: 'name',
        };
        const data = { name: 'test-name', title: 'test-title' };
        getFilteredOutput(data, options);
        expect(getPrintedLines()[0]).to.contain(['[DEPRECATION WARNING] --query']);
        expect(getPrintedConsoleLines()[0]).to.not.contain('title');
        expect(getPrintedConsoleLines()[0]).to.not.contain('test-title');
        expect(getPrintedConsoleLines()[0]).to.contain('test-name');
    });
});
