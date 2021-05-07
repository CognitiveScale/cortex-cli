/*
 * Copyright 2020 Cognitive Scale, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const commander = require('commander');
const chai = require('chai');
const { UploadContent } = require('../src/commands/content');
const { humanReadableFileSize } = require('../src/commands/utils');

const { expect } = chai;

describe('Upload Directory', () => {
    it('test upload', (done) => {
        const program = new commander.Command();
        const command = new UploadContent(program);
        const contentKey = '.shared';

        const filePath = `${__dirname}/cortex`;
        const options = {
            recursive: true,
            test: true,
        };

        const expectedFileDicts = [
            {
 canonical: `${__dirname}/cortex/config`,
              relative: 'config',
              size: 483,
            },
            {
 canonical: `${__dirname}/cortex/sample/upload/config`,
              relative: 'sample/upload/config',
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
