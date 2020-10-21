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

const findPackageJson = require('find-package-json');
const os = require('os');
const osName = require('os-name');

const pkg = findPackageJson(__dirname).next().value;

module.exports.getUserAgent = function getUserAgent() {
    return `${pkg.name}/${pkg.version} (${os.platform()}; ${os.arch()}; ${os.release()}; ${osName()})`;
};
