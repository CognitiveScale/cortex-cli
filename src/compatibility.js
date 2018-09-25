/*
 * Copyright 2018 Cognitive Scale, Inc. All Rights Reserved.
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

const boxen = require('boxen');
const chalk = require('chalk');
const concat = require('lodash/fp/concat');
const debug = require('debug')('cortex:cli');
const filter = require('lodash/fp/filter');
const findPackageJson = require('find-package-json');
const getOr = require('lodash/fp/getOr');
const isInstalledGlobally = require('is-installed-globally');
const keys = require('lodash/fp/keys');
const last = require('lodash/fp/last');
const npmFetch = require('npm-registry-fetch');
const request = require('superagent');
const semver = require('semver');
const uniq = require('lodash/fp/uniq');

const { loadProfile } = require('./config');
const { printError } = require('../src/commands/utils');

const pkg = findPackageJson(__dirname).next().value;

function getAvailableVersions(name) {
    debug('getAvailableVersions => %s', name);
    return npmFetch
        .json(pkg.name)
        .then(manifest => keys(getOr({}, 'versions', manifest)))
        .then(versions => uniq(concat(versions, pkg.version)))
        .then(versions => versions.sort(semver.compare))
        .catch((error) => {
            throw new Error('Unable to determine CLI available versions');
        });
}

function getRequiredVersion(profile) {
    const endpoint = `${profile.url}/v3/catalog/compatibility/applications/cortex-cli`;
    debug('getRequiredVersion => %s', endpoint);
    return request
        .get(endpoint)
        .set('Authorization', `Bearer ${profile.token}`)
        .set('x-cortex-proxy-notify', true)
        .then((res) => {
            if (!res.ok) {  throw new Error('Unable to fetch compatibility'); }
            const { semver } = res.body;
            return semver;
        });
}

function notifyUpdate({ required = false, current, latest }) {
    const opts = {
        padding: 1,
        margin: 1,
        align: 'center',
        borderColor: 'yellow',
        borderStyle: 'round'
    };

    const message =
        `Update ${required ? chalk.bold('required') : 'available'} ` +
        chalk.dim(current) +
        chalk.reset(' → ') +
        chalk.green(latest) +
        '\nRun ' +
        chalk.cyan(`npm i ${isInstalledGlobally ? '-g ' : ''}${pkg.name}@${latest}`) +
        ' to update';

    console.log(boxen(message, opts));
}

function upgradeAvailable(args) {
    process.on('exit', () => {
        notifyUpdate(args);
    });
}

function upgradeRequired(args) {
    notifyUpdate({ required: true, ...args });
    process.exit(-1);
}

function getCompatibility(profile) {
    debug('getCompatibility => %s profile', profile.name);
    return Promise
        .all([
            getAvailableVersions(pkg.name),
            getRequiredVersion(profile)
        ])
        .then(([versions, requirements]) => {
            debug('getCompatibility => versions: %s, requirements: %s', versions, requirements);
            const compatibleVersions = filter(v => semver.satisfies(v, requirements), versions);
            debug('getCompatibility => compatible versions: %s', compatibleVersions);
            const { version: current } = pkg;
            const latest = last(compatibleVersions);
            const satisfied = semver.satisfies(pkg.version, requirements);
            debug('getCompatibility => satisfied: %s', satisfied);
            return ({ current, latest, satisfied });
        });
};

function withCompatibilityCheck(fn) {
    return (...args) => {
        const options = last(args) || {};

        if (options.compat) {
            const { profile: profileName } = options;
            const profile = loadProfile(profileName);

            return getCompatibility(profile)
                .then(({ current, latest, satisfied }) => {
                    if (!satisfied) {
                        upgradeRequired({ current, latest });
                    }
                    else if (semver.gt(latest, current)) {
                        upgradeAvailable({ current, latest });
                    }
                })
                .then(() => fn(...args))
                .catch((error) => {
                    printError(error);
                });
        }

        return Promise.resolve().then(() => fn(...args));
    };
};

module.exports = {
    getCompatibility,
    withCompatibilityCheck
}