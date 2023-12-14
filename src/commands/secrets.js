import fs from 'node:fs';
import debugSetup from 'debug';
import getOr from 'lodash/fp/getOr.js';
import isUndefined from 'lodash/fp/isUndefined.js';
import map from 'lodash/fp/map.js';
import { loadProfile } from '../config.js';
import Secrets from '../client/secrets.js';
import {
    printSuccess, printError, filterObject, parseObject, printTable, handleTable, getFilteredOutput, handleError,
} from './utils.js';

const debug = debugSetup('cortex:cli');
export const ListSecretsCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listsecrets(%s)', profile.name);
        const secrets = new Secrets(profile.url);
        try {
            const result = await secrets.listSecrets(options.project || profile.project, profile.token);
            // TODO remove --query on deprecation
            if (options.json || options.query) {
                getFilteredOutput(result, options);
            } else {
                const tableSpec = [
                    {
                        column: 'Secret Key Name',
                        field: 'keyName',
                        width: 50,
                    },
                ];
                handleTable(tableSpec, map((x) => ({ keyName: x }), result), null, 'No secrets found');
            }
        } catch (err) {
            handleError(err, options, 'Failed to list secrets');
        }
    }
};
export const ReadSecretsCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(keyName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.readsecret(%s)', profile.name, keyName);
        const secrets = new Secrets(profile.url);
        try {
            const response = await secrets.readSecret(options.project || profile.project, profile.token, keyName);
                const result = filterObject(response, options);
                if (options.json) printSuccess(JSON.stringify(result, null, 2), options);
                else {
                    const tableSpec = [
                        { column: 'Key Name', field: 'keyName', width: 50 },
                        { column: 'Value (Not Shown)', field: 'value', width: 50 },
                    ];
                    printTable(tableSpec, [{ keyName, value: JSON.stringify(getOr(undefined, 'value', result), null, 2) }]);
                }
            } catch (err) {
                    handleError(err, options, 'Failed to read secure secret');
            }
    }
};
export const WriteSecretsCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(keyName, value, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.writeSecret(%s)', profile.name, keyName);
        let data = value;
        if (options.data) {
            try {
                data = parseObject(options.data, options);
            } catch (e) {
                printError(`Failed to parse data: ${options.data} Error: ${e}`, options);
            }
        } else if (options.dataFile) {
            const dataStr = fs.readFileSync(options.dataFile);
            data = parseObject(dataStr, options);
        }
        if (isUndefined(data)) {
            return printError('Failed to write secret : no value specified', options);
        }
        // FAB-1775: validate secret key name
        const invalidCharsRegex = /^\w+([./-]?\w+)*$/;
        if (!invalidCharsRegex.test(keyName)) {
            return printError(`Failed to write secret : keyName did not conform to regex ${JSON.stringify(invalidCharsRegex)}`, options);
        }
        const secrets = new Secrets(profile.url);
        try {
            const response = secrets.writeSecret(options.project || profile.project, profile.token, keyName, data);
            return printSuccess(response.message, options);
        } catch (err) {
            return handleError(err, options, 'Failed to write secret');
        }
    }
};
export const DeleteSecretCommand = class {
    constructor(program) {
        this.program = program;
    }

    async execute(keyName, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteSecret(%s)', profile.name, keyName);
        const secretsClient = new Secrets(profile.url);
        try {
            const response = await secretsClient.deleteSecret(options.project || profile.project, profile.token, keyName);
            printSuccess(response?.message ?? response, options);
        } catch (err) {
            handleError(err, options, `Secret "${keyName}" deletion failed`);
        }
    }
};
