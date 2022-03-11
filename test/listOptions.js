const assert = require('assert');

const { validateOptions } = require('../src/commands/utils');

describe('List command limit option check', () => {
    it('should accept a positive integer', () => {
        const options = {
            limit: 5,
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'has no errors');
    });

    it('should accept a number string', () => {
        const options = {
            limit: '5',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'has no errors');
    });

    it('should not accept value less than 1', () => {
        const options = {
            limit: -1,
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid limit, limit should be a valid positive number') === true, 'Is invalid limit');
    });

    it('should not accept a non-number string', () => {
        const options = {
            limit: 'hello-world',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid limit, limit should be a valid positive number') === true, 'Is invalid limit');
    });

    it('should not accept other data-types', () => {
        const options = {
            limit: { hello: 'world' },
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid limit, limit should be a valid positive number') === true, 'Is invalid limit');
    });
});

describe('List command skip option check', () => {
    it('should accept a positive integer', () => {
        const options = {
            skip: 5,
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'has no errors');
    });

    it('should accept a number string', () => {
        const options = {
            skip: '5',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'has no errors');
    });

    it('should not accept a non positive limit value', () => {
        const options = {
            skip: -1,
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid skip');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid skip, skip should be a valid non negative number') === true, 'Is invalid skip');
    });

    it('should not accept a non-number string', () => {
        const options = {
            skip: 'hello-world',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid skip');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid skip, skip should be a valid non negative number') === true, 'Is invalid skip');
    });

    it('should not accept other data-types', () => {
        const options = {
            skip: { hello: 'world' },
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid skip');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid skip, skip should be a valid non negative number') === true, 'Is invalid skip');
    });
});

describe('List command filter option check', () => {
    it('should accept a valid json string', () => {
        const options = {
            filter: '{"name": "test-name"}',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'has no errors');
    });
    it('should not accept an invalid json', () => {
        const options = {
            filter: '{"name": "name-1}',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid filter expression') === true, 'Is invalid filter');
    });

    it('should not accept a number field', () => {
        const options = {
            filter: 5,
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid filter expression') === true, 'Is invalid filter');
    });

    it('should not accept a non json string', () => {
        const options = {
            filter: 'hello-world',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid filter expression') === true, 'Is invalid filter');
    });
});

describe('List command sort option check', () => {
    it('should accept a valid json string with a stringified number value', () => {
        const options = {
            sort: '{"name": "1"}',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'has no errors');
    });
    it('should accept a valid json string with a number value', () => {
        const options = {
            sort: '{"name": -1}',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === true, 'Valid skip');
        assert.ok(errorDetails.length === 0, 'has no errors');
    });
    it('should not accept a key with value other than 1 or -1', () => {
        const options = {
            sort: '{"name": 0}',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Valid skip');
        assert.ok(JSON.stringify(errorDetails)
            .includes('Sort values can only be 1(ascending) or -1(descending)') === true, 'Is invalid skip');
    });
    it('should not accept an invalid json', () => {
        const options = {
            sort: '{"name": "name-1}',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid skip');
        assert.ok(JSON.stringify(errorDetails)
            .includes('Invalid sort expression') === true, 'Is invalid filter');
    });

    it('should not accept a number field', () => {
        const options = {
            sort: 5,
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid skip');
        assert.ok(JSON.stringify(errorDetails)
            .includes('Invalid sort expression') === true, 'Is invalid filter');
    });

    it('should fail with non json string', () => {
        const options = {
            sort: 'hello-world',
        };
        const { validOptions, errorDetails } = validateOptions(options);
        assert.ok(validOptions === false, 'Invalid skip');
        assert.ok(JSON.stringify(errorDetails)
            .includes('Invalid sort expression') === true, 'Is invalid skip');
    });
});

describe('List model command option check', () => {
    it('list valid command options', () => {
        const options = {
            filter: '{"name1": "name-1"}',
            sort: '{"name2": 1}',
            limit: -1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'MODEL');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes('Invalid filter params') === true, 'Is invalid filter');
    });
});
