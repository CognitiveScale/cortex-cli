const { expect } = require('chai');
const { getQueryOptions } = require('../src/commands/utils');

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

    it('should override --json [arg] the if --query arg is passed', () => {
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
