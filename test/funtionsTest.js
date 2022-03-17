const _ = require('lodash');
const { expect } = require('chai');
const mockedEnv = require('mocked-env');
const sinon = require('sinon');

const {
    handleTable,
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

    it('should print supplied no string when empty data', () => {
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
