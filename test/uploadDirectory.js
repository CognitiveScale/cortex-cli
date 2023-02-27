import path from 'node:path';
import url from 'node:url';
import * as commander from 'commander';
import chai from 'chai';
import mockedEnv from 'mocked-env';
import { UploadContent } from '../src/commands/content.js';
import { humanReadableFileSize } from '../src/commands/utils.js';

const { expect } = chai;
let restoreEnv;
describe('Upload Directory', () => {
    before(() => {
        restoreEnv = mockedEnv({
            CORTEX_CONFIG_DIR: './test/cortex',
        });
    });
    after(() => {
        restoreEnv();
    });
    it('test upload', (done) => {
        const program = new commander.Command();
        const command = new UploadContent(program);
        const contentKey = '.shared';
        const dirname = url.fileURLToPath(new URL('.', import.meta.url)).split(path.sep).join(path.posix.sep);
        const filePath = path.posix.join(dirname, 'cortex');
        const options = {
            recursive: true,
            test: true,
        };
        const expectedFileDicts = [
            {
                canonical: path.posix.join(dirname, 'cortex', 'config'),
                relative: 'config',
                size: 1611,
            },
            {
                canonical: path.posix.join(dirname, 'cortex', 'pat-file.json'),
                relative: 'pat-file.json',
                size: 326,
            },
            {
                canonical: path.posix.join(dirname, 'cortex', 'sample', 'upload', 'config'),
                relative: path.join('sample', 'upload', 'config'),
                size: 483,
            },
        ];
        command.execute(contentKey, filePath, options, (fileDicts) => {
            expect(fileDicts).to.deep.equal(expectedFileDicts);
            done();
        });
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
