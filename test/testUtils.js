const _ = require('lodash');
const { expect } = require('chai');
const mockedEnv = require('mocked-env');
const sinon = require('sinon');

const {
    handleTable,
    printExtendedLogs,
} = require('../src/commands/utils');

const { stripAnsi } = require('./utils');

const sampleData = [
    { user: 'user-1', name: 'user-name-1' },
    { user: 'user-2', name: 'user-name-2' },
    { user: 'user-3', name: 'user-name-3' },
];

const tableSpec = [
    { column: 'User', field: 'user' },
    { column: 'Name', field: 'name' },
];

let restore;
describe('Handle table function test', () => {
    let printSpy;
    before(() => {
        restore = mockedEnv({});
    });

    beforeEach(() => {
        printSpy = sinon.spy(console, 'log');
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

    it('should print supplied error message when data is empty', () => {
        handleTable(tableSpec, [], null, 'No users found');
        expect(getPrintedLines()).to.eql(['No users found']);
    });

    it('should print a table when data is present', () => {
        handleTable(tableSpec, sampleData, null, 'No users found');
        expect(getPrintedLines()).to.eql(
            [
                  '┌────────┬─────────────┐\n'
                + '│ User   │ Name        │\n'
                + '├────────┼─────────────┤\n'
                + '│ user-1 │ user-name-1 │\n'
                + '├────────┼─────────────┤\n'
                + '│ user-2 │ user-name-2 │\n'
                + '├────────┼─────────────┤\n'
                + '│ user-3 │ user-name-3 │\n'
                + '└────────┴─────────────┘',
            ],
        );
    });
});

describe('Test printExtendedLogs function', () => {
    let printSpy;
    const data = [
        { key1: 'val1' },
        { key2: 'val2' },
        { key3: 'val3' },
        { key4: 'val4' },
    ];
    const limit = 5;
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

    it('should print the result limited message if data length is equal to limit value', () => {
        printExtendedLogs([...data, { key5: 'val5' }], { limit });
        expect(getPrintedLines()).to.eql([`Results limited to ${limit} rows\n`]);
    });

    it('should not print the result limited message if data length is less than limit value', () => {
        printExtendedLogs(data, { limit });
        expect(getPrintedLines()).to.eql([]);
    });
});
