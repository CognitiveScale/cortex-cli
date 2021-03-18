/*
 * Copyright 2021 Cognitive Scale, Inc. All Rights Reserved.
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

const glob = require('glob');
const fs = require('fs');
const path = require('path');

function checkFiles(dir) {
    const errs = [];
    const buff = Buffer.alloc(1024);
    const list = glob.sync(path.join(dir, '**', '*.js'));
    list.forEach((fileName) => {
        const fd = fs.openSync(fileName);
        fs.readSync(fd, buff, 0, 1000);
        // We can just use exact string match should be the same...
        if (!buff.toString().includes('Cognitive Scale, Inc. All Rights Reserved')) {
            errs.push(fileName);
        }
    });
    return errs;
}

describe('check for copyright headers', () => {
    it('all ./src/ have copyright', (done) => {
        const errs = checkFiles(path.join('.', 'src'));
        if (errs.length > 0) {
            throw Error(`Following files are missing copyright header: ${errs}`);
        }
        done();
    });
    it('all ./bin/ have copyright', (done) => {
        const errs = checkFiles(path.join('.', 'bin'));
        if (errs.length > 0) {
            throw Error(`Following files are missing copyright header: ${errs}`);
        }
        done();
    });
    it('all ./test/ have copyright', (done) => {
        const errs = checkFiles(path.join('.', 'test'));
        if (errs.length > 0) {
            throw Error(`Following files are missing copyright header: ${errs}`);
        }
        done();
    });
});
