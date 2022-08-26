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
    before(() => {
        restore = mockedEnv({});
    });

    beforeEach(() => {
        printSpy = sinon.spy(process.stderr, 'write');
    });

    afterEach(() => {
        printSpy.restore();
    });

    after(() => {
        restore();
    });

    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
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
        expect(getPrintedLines()[1]).to.eql(`error: option '--query <query>' has an invalid argument: ${queryPath} \n`);
    });
});
