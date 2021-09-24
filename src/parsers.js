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
const program = require('commander');

function nonEmptyStringParser(opts) {
    const { message = 'empty string argument', variadic = false } = opts;
    return function parseNonEmptyString(value, oldValue) {
        if (_.isEmpty(value)) {
            const error = `error: ${message}`;
            console.error(error);
            program._exit(1, 'cortex.invalidStringArgument', error);
        }
        if (variadic) {
            if (!Array.isArray(oldValue)) {
                return [value];
            }
            return oldValue.concat(value);
        }
        return value;
    };
}

module.exports = {
    nonEmptyStringParser,
};
