import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { globSync } from 'glob';
import docGen from '../generate_docs.js';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Test docgen', () => {
        beforeEach(() => {
            process.env.CORTEX_SKIP_INIT_PROFILE = '1';
        });
        afterEach(() => {
            delete process.env.CORTEX_SKIP_INIT_PROFILE;
        });
        const cmdJses = globSync('./bin/*.js', { absolute: true });
        cmdJses.forEach((commandJS) => {
        it(`Generate docs for ${commandJS}`, async () => {
            const { default: program } = await import(commandJS);
            const docStr = docGen(program);
            // eslint-disable-next-line no-unused-expressions
            expect(docStr).not.be.empty;
        });
    });
});
