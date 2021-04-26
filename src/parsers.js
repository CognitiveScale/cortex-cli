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

const _ = require('lodash');
const program = require('./commander');

function nonEmptyStringParser(message = 'empty string argument') {
    return function parseNonEmptyString(arg) {
        if (_.isEmpty(arg) || (_.isArray(arg) && arg.filter(val => _.isEmpty(val)).length > 0)) {
            const error = `error: ${message}`;
            console.error(error);
            program._exit(1, 'cortex.invalidStringArgument', error);
        }
        return arg;
    };
}

module.exports = {
    nonEmptyStringParser,
};
