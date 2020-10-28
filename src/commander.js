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
const identity = require('lodash/fp/identity');
const merge = require('lodash/fp/merge');

const { exportDoc } = require('./commands/utils.js');

// Monkey-patch `commander` library to keep track of when an action executes
commander.Command.prototype._action = commander.Command.prototype.action;
commander.Command.prototype.action = function (fn) {
    return this._action(function wrapped(...args) {
        (this.parent || this)._actionTaken = true;
        fn(...args);
    });
};

commander.Command.prototype.wasActionTaken = function () {
    return (this.parent || this)._actionTaken || false;
};

commander.Command.prototype.helpAndExit = function () {
    this.outputHelp(identity);
    process.exit(1);
};

commander.Command.prototype._parse = commander.Command.prototype.parse;
commander.Command.prototype.parse = function (argv, options) {
    const defaultOpts = { noActionHandler: this.helpAndExit.bind(this) };
    const opts = merge(defaultOpts, options || {});
    process.env.DOC && exportDoc(this);

    this._parse(argv);
    if (!this.wasActionTaken()) {
        if (process.env.CORTEX_TOKEN) {
            console.error('Using token from environment variable $CORTEX_TOKEN');
        }
        opts.noActionHandler();
    }
};

module.exports = commander;
