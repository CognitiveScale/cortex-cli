import _ from 'lodash';
import * as Table from 'cli-table3';
import chalk from 'chalk';
import concat from 'lodash/fp/concat.js';
import debugSetup from 'debug';
import filter from 'lodash/fp/filter.js';
import getOr from 'lodash/fp/getOr.js';
import keys from 'lodash/fp/keys.js';
import last from 'lodash/fp/last.js';
import isInstalledGlobally from 'is-installed-globally';
import npmFetch from 'npm-registry-fetch';
import Semver from 'semver';
import { got, getUserAgent } from './client/apiutils.js';
import { loadProfile } from './config.js';
import { printError, printWarning, readPackageJSON } from './commands/utils.js';

const debug = debugSetup('cortex:cli');

const pkg = readPackageJSON('../../package.json');

function getAvailableVersions(name) {
    debug('getAvailableVersions => %s', name);
    return npmFetch
        .json(pkg.name)
        .then((manifest) => keys(getOr({}, 'versions', manifest)))
        .then((versions) => _.uniq(concat(versions, pkg.version)))
        .then((versions) => versions.sort(Semver.compare))
        .catch(() => {
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

export function notifyUpdate({ required = false, current, latest }) {
    const message = `Update ${required ? chalk.bold('required') : 'available'} ${chalk.dim(current)}${chalk.reset(' → ')}${chalk.green(latest)}\nRun ${chalk.cyan(`npm i ${isInstalledGlobally ? '-g ' : ''}${pkg.name}@${latest}`)} to update`;
    const table = new Table({
        chars: {
            'top-left': '╭',
            'top-right': '╮',
            'bottom-left': '╰',
            'bottom-right': '╯',
        },
        style: { head: [], border: [] },
    });
    table.push([message]);
    console.warn(table.toString());
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

export async function getCompatibility(profile) {
    debug('getCompatibility => %s profile', profile.name);
    try {
        // fail if unable to contact cortex service
        const requirements = await getRequiredVersion(profile);
        const satisfied = Semver.satisfies(pkg.version, requirements);
        try {
            // warn user but don't fail
            const versions = await getAvailableVersions(pkg.name);
            debug('getCompatibility => versions: %s, requirements: %s', versions, requirements);
            const compatibleVersions = filter((v) => Semver.satisfies(v, requirements), versions);
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

export function withCompatibilityCheck(fn) {
    return (...args) => {
        const command = args.find((a) => a !== undefined && typeof a.opts === 'function');
        const options = command.opts();
        if (options.compat && !_.toLower(process.env.CORTEX_NO_COMPAT) === 'true') {
            const { profile: profileName } = options;
            const profile = loadProfile(profileName);
            return getCompatibility(profile)
                .then(({ current, latest, satisfied }) => {
                    if (!satisfied) {
                        upgradeRequired({ current, latest });
                    } else if (Semver.gt(latest, current)) {
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

export function doCompatibilityCheck(profile, doCheck = true) {
    if (doCheck && !_.toLower(process.env.CORTEX_NO_COMPAT) === 'true') {
        return getCompatibility(profile)
            .then(({ current, latest, satisfied }) => {
                if (!satisfied) {
                    upgradeRequired({ current, latest });
                } else if (Semver.gt(latest, current)) {
                    upgradeAvailable({ current, latest });
                }
            })
            .catch((error) => {
                 printError(error);
            });
    }
    return Promise.resolve();
}
