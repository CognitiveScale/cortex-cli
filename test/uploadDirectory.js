import path from 'node:path';
import url from 'node:url';
import chai from 'chai';
import mockedEnv from 'mocked-env';
import sinon from 'sinon';
import _ from 'lodash';
import { create } from '../bin/cortex-content.js';
import { humanReadableFileSize } from '../src/commands/utils.js';
import { stripAnsi } from './utils.js';
import Info from '../src/client/info.js';
import Content from '../src/client/content.js';

const { expect } = chai;
describe('Upload Directory', () => {
    let restoreEnv;
    let sandbox;
    let printSpy;
    let errorSpy;
    function getPrintedLines() {
        return _.flatten(printSpy.args).map((s) => stripAnsi(s));
    }

    function getErrorLines() {
        return _.flatten(errorSpy.args).map((s) => stripAnsi(s));
    }

    before(() => {
        restoreEnv = mockedEnv({
            CORTEX_CONFIG_DIR: './test/cortex',
        });
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(process, 'exit');
        sandbox.stub(Info.prototype, 'getInfo').callsFake(() => ({
            serverTs: Date.now(),
        }));
        printSpy = sandbox.spy(console, 'log');
        errorSpy = sandbox.spy(console, 'error');
    });
    
    after(() => restoreEnv());
    afterEach(() => sandbox.restore());

    it('test upload successfull', async () => {
        const program = create();
        const contentKey = '.shared';
        sandbox.stub(Content.prototype, 'uploadContentStreaming').returns({ success: true });
        const dirname = url.fileURLToPath(new URL('.', import.meta.url)).split(path.sep).join(path.posix.sep);
        const filePath = path.posix.join(dirname, 'cortex');
        await program.parseAsync(['node', 'content', 'upload', '--project', 'FOO', '--recursive', contentKey, filePath]);
        const lines = getPrintedLines();
        expect(lines).to.include('326B\tpat-file.json -> .shared/pat-file.json');
        expect(lines).to.include('1.6K\tconfig -> .shared/config');
        expect(lines).to.include('483B\tsample/upload/config -> .shared/sample/upload/config');
        // eslint-disable-next-line no-unused-expressions
        expect(getErrorLines()).is.empty; // Assume no errors
    });
    it('test upload error', async () => {
        const program = create();
        const contentKey = '.shared';
        // can't contact cluster..
        // sandbox.stub(Content.prototype, 'uploadContentStreaming').returns({ success: true });
        const dirname = url.fileURLToPath(new URL('.', import.meta.url)).split(path.sep).join(path.posix.sep);
        const filePath = path.posix.join(dirname, 'cortex');
        await program.parseAsync(['node', 'content', 'upload', '--project', 'FOO', '--chunkSize', 1, '--recursive', contentKey, filePath]);
        const lines = getPrintedLines();
        const errLines = getErrorLines();
        expect(lines).to.include('326B\tpat-file.json -> .shared/pat-file.json');
        expect(lines).to.include('1.6K\tconfig -> .shared/config');
        expect(lines).to.include('483B\tsample/upload/config -> .shared/sample/upload/config');
        // eslint-disable-next-line no-unused-expressions
        expect(errLines).to.have.length(1);
    });
});

describe('Human Readable File Size', () => {
    it('bytes', (done) => {
        const sizeInBytes = 260;
        const formattedFileSize = humanReadableFileSize(sizeInBytes);
        expect(formattedFileSize).to.have.string('260B');
        done();
    });
    it('KB', (done) => {
        const sizeInBytes = 1200;
        const formattedFileSize = humanReadableFileSize(sizeInBytes);
        expect(formattedFileSize).to.have.string('1.2K');
        done();
    });
    it('MB', (done) => {
        const sizeInBytes = 1000000;
        const formattedFileSize = humanReadableFileSize(sizeInBytes);
        expect(formattedFileSize).to.have.string('1M');
        done();
    });
    it('1MB less some', (done) => {
        const sizeInBytes = (10 ** 3) - 1;
        const formattedFileSize = humanReadableFileSize(sizeInBytes);
        expect(formattedFileSize).to.have.string('999B');
        done();
    });
    it('1k 200 bytes less', (done) => {
        const sizeInBytes = 1000000 - 200;
        const formattedFileSize = humanReadableFileSize(sizeInBytes);
        expect(formattedFileSize).to.have.string('999.8K');
        done();
    });
    it('1k less', (done) => {
        const sizeInBytes = (10 ** 6) - 1;
        const formattedFileSize = humanReadableFileSize(sizeInBytes);
        expect(formattedFileSize).to.have.string('999.9K');
        done();
    });
    it('several GB', (done) => {
        const sizeInBytes = 32 * (10 ** 9) + 345 * (10 ** 6);
        const formattedFileSize = humanReadableFileSize(sizeInBytes);
        expect(formattedFileSize).to.have.string('32.3G');
        done();
    });
});
