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
const semver = require('semver');
const uniq = require('lodash/fp/uniq');
const { got } = require('./client/apiutils');
const { loadProfile } = require('./config');
const { printError, printWarning, getUserAgent } = require('../src/commands/utils');

const pkg = findPackageJson(__dirname).next().value;

function getAvailableVersions(name) {
    debug('getAvailableVersions => %s', name);
    return npmFetch
        .json(pkg.name)
        .then(manifest => keys(getOr({}, 'versions', manifest)))
        .then(versions => uniq(concat(versions, pkg.version)))
        .then(versions => versions.sort(semver.compare))
        .catch((_) => {
            throw new Error('Unable to determine CLI available versions');
        });
}

function getRequiredVersion(profile) {
    const endpoint = `${profile.url}/fabric/v4/compatibility/applications/cortex-cli`;
    debug('getRequiredVersion => %s', endpoint);
    return got
        .get(endpoint, {
             headers: {
                Authorization: `Bearer ${profile.token}`,
                'user-agent': getUserAgent(),
         },
})
        .json()
        .then((res) => {
            const { semver } = res;
            return semver;
        }).catch((err) => {
            throw new Error(`Unable to fetch compatibility: ${err.message}`);
        });
}

function notifyUpdate({ required = false, current, latest }) {
    const opts = {
        padding: 1,
        margin: 1,
        align: 'center',
        borderColor: 'yellow',
        borderStyle: 'round',
    };

    const message = `Update ${required ? chalk.bold('required') : 'available'} ${
         chalk.dim(current)
         }${chalk.reset(' → ')
         }${chalk.green(latest)
         }\nRun ${
         chalk.cyan(`npm i ${isInstalledGlobally ? '-g ' : ''}${pkg.name}@${latest}`)
         } to update`;

    console.warn(boxen(message, opts));
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

async function getCompatibility(profile) {
    debug('getCompatibility => %s profile', profile.name);
    try {
        // fail if unable to contact cortex service
        const requirements = await getRequiredVersion(profile);
        const satisfied = semver.satisfies(pkg.version, requirements);
        try {
            // warn user but don't fail
            const versions = await getAvailableVersions(pkg.name);
            debug('getCompatibility => versions: %s, requirements: %s', versions, requirements);
            const compatibleVersions = filter(v => semver.satisfies(v, requirements), versions);
            debug('getCompatibility => compatible versions: %s', compatibleVersions);
            const { version: current } = pkg;
            const latest = last(compatibleVersions);
            debug('getCompatibility => satisfied: %s', satisfied);
            return ({ current, latest, satisfied });
        } catch (e) {
            printWarning(`Warning unable to check for cortex-cli update: ${e.message}`);
            return ({ current: pkg.version, latest: pkg.version, satisfied });
        }
    } catch (e) {
        throw new Error(`Unable to contact cortex: ${e.message}`);
    }
}

function withCompatibilityCheck(fn) {
    return (...args) => {
        const command = last(args);
        const options = command.opts();
        if (options.compat) {
            const { profile: profileName } = options;
            const profile = loadProfile(profileName);
            return getCompatibility(profile)
                .then(({ current, latest, satisfied }) => {
                    if (!satisfied) {
                        upgradeRequired({ current, latest });
                    } else if (semver.gt(latest, current)) {
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
}

module.exports = {
    getCompatibility,
    withCompatibilityCheck,
};
