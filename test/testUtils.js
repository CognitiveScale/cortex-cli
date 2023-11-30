import _ from 'lodash';
import { expect } from 'chai';
import mockedEnv from 'mocked-env';
import sinon from 'sinon';
import {
 handleTable,
 printExtendedLogs,
 handleListFailure,
 handleDeleteFailure,
 checkForEmptyArgs,
 printCrossTable,
} from '../src/commands/utils.js';
import { stripAnsi } from './utils.js';

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
        expect(getPrintedLines()).to.eql([
            '┌────────┬─────────────┐\n'
                + '│ User   │ Name        │\n'
                + '├────────┼─────────────┤\n'
                + '│ user-1 │ user-name-1 │\n'
                + '├────────┼─────────────┤\n'
                + '│ user-2 │ user-name-2 │\n'
                + '├────────┼─────────────┤\n'
                + '│ user-3 │ user-name-3 │\n'
                + '└────────┴─────────────┘',
        ]);
    });
});
describe('Printing Cross-Tables', () => {
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

    it('should print a cross-table when data is present', () => {
        const tableSections = {
            first: [sampleData[0]],
            second: [],
            third: [sampleData[1], sampleData[2]],
        };
        printCrossTable(tableSpec, tableSections);
        expect(getPrintedLines()).to.eql([
            '┌────────┬────────┬─────────────┐\n'
            + '│        │ User   │ Name        │\n'
            + '├────────┼────────┼─────────────┤\n'
            + '│ first  │ user-1 │ user-name-1 │\n'
            + '├────────┼────────┼─────────────┤\n'
            + '│ second │ -      │ -           │\n'
            + '├────────┼────────┼─────────────┤\n'
            + '│        │ user-2 │ user-name-2 │\n'
            + '│ third  ├────────┼─────────────┤\n'
            + '│        │ user-3 │ user-name-3 │\n'
            + '└────────┴────────┴─────────────┘',
        ]);
    });

    it('should print a cross-table with an explicit column widths (abbreviates fields)', () => {
        const tableSpec2 = JSON.parse(JSON.stringify(tableSpec)); // TODO: structuredClone()
        tableSpec2.unshift({ column: '', width: 5 });
        tableSpec2[1].width = 10;
        tableSpec2[2].width = 10;
        const tableSections = {
            first: [],
            second: [sampleData[0]],
            reallyReallyReallyLongName: [sampleData[1], sampleData[2]],
        };
        printCrossTable(tableSpec2, tableSections);
        expect(getPrintedLines()).to.eql([
            '┌─────┬──────────┬──────────┐\n'
            + '│     │ User     │ Name     │\n'
            + '├─────┼──────────┼──────────┤\n'
            + '│ fi… │ -        │ -        │\n'
            + '├─────┼──────────┼──────────┤\n'
            + '│ se… │ user-1   │ user-na… │\n'
            + '├─────┼──────────┼──────────┤\n'
            + '│     │ user-2   │ user-na… │\n'
            + '│ re… ├──────────┼──────────┤\n'
            + '│     │ user-3   │ user-na… │\n'
            + '└─────┴──────────┴──────────┘',
        ]);
    });

    it('should print a cross-table with an explicit column widths and table options', () => {
        const tableSpec2 = JSON.parse(JSON.stringify(tableSpec)); // TODO: structuredClone()
        tableSpec2.unshift({ column: '', width: 25 });
        tableSpec2[1].width = 5;
        tableSpec2[2].width = 5;
        const tableSections = {
            first: [],
            second: [sampleData[0]],
            reallyReallyReallyLongName: [sampleData[1], sampleData[2]],
        };
        printCrossTable(tableSpec2, tableSections, {
            // Verify that tableOptions are honored - expect columns 2 & 3 to wrap words
            wordWrap: true,
            wrapOnWordBoundary: false,
        });
        expect(getPrintedLines()).to.eql([
            '┌─────────────────────────┬─────┬─────┐\n'
            + '│                         │ Use │ Nam │\n'
            + '│                         │ r   │ e   │\n'
            + '├─────────────────────────┼─────┼─────┤\n'
            + '│          first          │ -   │ -   │\n'
            + '├─────────────────────────┼─────┼─────┤\n'
            + '│                         │ use │ use │\n'
            + '│                         │ r-1 │ r-n │\n'
            + '│         second          │     │ ame │\n'
            + '│                         │     │ -1  │\n'
            + '├─────────────────────────┼─────┼─────┤\n'
            + '│                         │ use │ use │\n'
            + '│                         │ r-2 │ r-n │\n'
            + '│                         │     │ ame │\n'
            + '│                         │     │ -2  │\n'
            + '│   reallyReallyReally    ├─────┼─────┤\n'
            + '│        LongName         │ use │ use │\n'
            + '│                         │ r-3 │ r-n │\n'
            + '│                         │     │ ame │\n'
            + '│                         │     │ -3  │\n'
            + '└─────────────────────────┴─────┴─────┘',
        ]);
    });

    it('should print a cross-table when no data is present', () => {
        const tableSections = {
            first: [],
            second: [],
            third: [],
            fourth: [],
        };
        printCrossTable(tableSpec, tableSections);
        expect(getPrintedLines()).to.eql([
            '┌────────┬──────┬──────┐\n'
            + '│        │ User │ Name │\n'
            + '├────────┼──────┼──────┤\n'
            + '│ first  │ -    │ -    │\n'
            + '├────────┼──────┼──────┤\n'
            + '│ second │ -    │ -    │\n'
            + '├────────┼──────┼──────┤\n'
            + '│ third  │ -    │ -    │\n'
            + '├────────┼──────┼──────┤\n'
            + '│ fourth │ -    │ -    │\n'
            + '└────────┴──────┴──────┘',
        ]);
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
describe('Test handleListFailure function', () => {
    let printSpy;
    before(() => {
        restore = mockedEnv({});
    });
    beforeEach(() => {
        printSpy = sinon.spy(console, 'log');
        sinon.stub(process, 'exit');
    });
    afterEach(() => {
        printSpy.restore();
        process.exit.restore();
    });
    after(() => {
        restore();
    });
    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }
    const errResponse = {
        status: 400,
        details: [
            { type: 'type1', message: 'message1' },
            { type: 'type2', message: 'message2' },
            { type: 'type3', message: 'message3' },
        ],
    };
    it('should print tabular output if status is 400', () => {
        handleListFailure(errResponse, null, 'test-resource');
        expect((getPrintedLines()[0])).to.equal('┌────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐\n'
            + '│ Option Type        │ Message                                                                                                                │\n'
            + '├────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤\n'
            + '│ type1              │ message1                                                                                                               │\n'
            + '├────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤\n'
            + '│ type2              │ message2                                                                                                               │\n'
            + '├────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤\n'
            + '│ type3              │ message3                                                                                                               │\n'
            + '└────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘');
        // eslint-disable-next-line no-unused-expressions
        expect(process.exit.calledWith(1)).to.be.true;
    });
    const errResponseTsoa = {
        status: 400,
        details: {
            'query.type1': {
                message: 'message1',
                value: '-1',
            },
        },
    };
    it('should print tabular output if status is 400 with TSOA response', () => {
        handleListFailure(errResponseTsoa, null, 'test-resource');
        expect((getPrintedLines()[0])).to.equal('┌────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐\n'
            + '│ Option Type        │ Message                                                                                                                │\n'
            + '├────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤\n'
            + '│ type1              │ message1                                                                                                               │\n'
            + '└────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘');
        // eslint-disable-next-line no-unused-expressions
        expect(process.exit.calledWith(1)).to.be.true;
    });
    const errResponseTsoaWithoutKey = {
        status: 400,
        details: {
            type1: {
                message: 'message1',
                value: '-1',
            },
        },
    };
    it('should print tabular output if status is 400 with TSOA response without dot in the key', () => {
        handleListFailure(errResponseTsoaWithoutKey, null, 'test-resource');
        expect((getPrintedLines()[0])).to.equal('┌────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐\n'
            + '│ Option Type        │ Message                                                                                                                │\n'
            + '├────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤\n'
            + '│ type1              │ message1                                                                                                               │\n'
            + '└────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘');
        // eslint-disable-next-line no-unused-expressions
        expect(process.exit.calledWith(1)).to.be.true;
    });
});
describe('Test handleDeleteFailure', () => {
    let printSpy;
    let errorSpy;
    before(() => {
        restore = mockedEnv({});
    });
    beforeEach(() => {
        printSpy = sinon.spy(console, 'log');
        errorSpy = sinon.spy(console, 'error');
        sinon.stub(process, 'exit');
    });
    afterEach(() => {
        printSpy.restore();
        errorSpy.restore();
        process.exit.restore();
    });
    after(() => {
        restore();
    });
    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }
    function getErrorLines() {
        return _.flatten(errorSpy.args).map((s) => stripAnsi(s));
    }
    const depErrorResponse = {
        status: 403,
        message: 'message',
        details: [
            { type: 'type1', name: 'name1' },
            { type: 'type2', name: 'name2' },
            { type: 'type3', name: 'name3' },
        ],
    };
    const serverErrorResponse = {
        status: 500,
        message: 'Server Unavailable',
        details: [],
    };
    it('should print tabular output if status is 403', () => {
        handleDeleteFailure(depErrorResponse, null, 'test-resource');
        expect(getErrorLines()[0]).to.equal('test-resource deletion failed: message.');
        expect((getPrintedLines()[0])).to.equal('┌────────────────────────────────────────────────────────────┬────────────────────────────────────────┐\n'
            + '│ Dependency Name                                            │ Dependency Type                        │\n'
            + '├────────────────────────────────────────────────────────────┼────────────────────────────────────────┤\n'
            + '│ name1                                                      │ type1                                  │\n'
            + '├────────────────────────────────────────────────────────────┼────────────────────────────────────────┤\n'
            + '│ name2                                                      │ type2                                  │\n'
            + '├────────────────────────────────────────────────────────────┼────────────────────────────────────────┤\n'
            + '│ name3                                                      │ type3                                  │\n'
            + '└────────────────────────────────────────────────────────────┴────────────────────────────────────────┘');
        // eslint-disable-next-line no-unused-expressions
        expect(process.exit.calledWith(1)).to.be.true;
    });
    it('should print the default error message is not 403 (500)', () => {
        handleDeleteFailure(serverErrorResponse, null, 'test-resource');
        expect(getErrorLines()[0]).to.equal('test-resource deletion failed: 500 Server Unavailable.');
        // eslint-disable-next-line no-unused-expressions
        expect(process.exit.calledWith(1)).to.be.true;
    });
});

describe('checkForEmptyArgs', () => {
    let printSpy;
    let errorSpy;
    before(() => {
        restore = mockedEnv({});
    });
    beforeEach(() => {
        printSpy = sinon.spy(console, 'log');
        errorSpy = sinon.spy(console, 'error');
        sinon.stub(process, 'exit');
    });
    afterEach(() => {
        printSpy.restore();
        errorSpy.restore();
        process.exit.restore();
    });
    after(() => {
        restore();
    });
    it('should throw an error for empty argument', () => {
      const args = {
        arg1: 'value1',
        arg2: '',
        arg3: 'value3',
      };

      const expectedErrorMessage = 'error: <arg2> cannot be empty.';

      try {
        checkForEmptyArgs(args);
      } catch (error) {
        // Check if the error message matches the expected error message
        expect(error.message).to.equal(expectedErrorMessage);
      }
    });

    it('should not throw an error when arguments are not empty', () => {
      const args = {
        arg1: 'value1',
        arg2: 'value2',
        arg3: 'value3',
      };

      expect(() => checkForEmptyArgs(args)).to.not.throw();
    });
  });
