const { expect } = require('chai');
const { getQueryOptions } = require('../src/commands/utils');

describe('Test printExtendedLogs function', () => {
    it('should have empty query string if options.json is true', () => {
        const options = {
            json: true,
        };
        const queryOptions = getQueryOptions(options);
        expect(queryOptions.query).to.eql('');
    });

    it('should retain the query string if options.json is not true', () => {
        const queryPath = '[].name';
        const options = {
            json: queryPath,
        };
        const queryOptions = getQueryOptions(options);
        expect(queryOptions.query).to.eql(queryPath);
    });
});
