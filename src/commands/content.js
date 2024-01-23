import _ from 'lodash';
import process from 'node:process';
import fs from 'node:fs';
import { PromisePool } from '@supercharge/promise-pool';
import debugSetup from 'debug';
import { loadProfile } from '../config.js';
import Content from '../client/content.js';
import {
    printSuccess, printError, getSourceFiles, humanReadableFileSize, handleTable, getFilteredOutput, checkProject, printNormalizedError,
} from './utils.js';

const debug = debugSetup('cortex:cli');

async function upload(contentClient, profile, options, contentKey, filePath, exit = true) {
    if (fs.lstatSync(filePath).isDirectory()) {
        printError('Uploads of directories require the option --recursive | -r', options);
    }
    const showProgress = !!options.progress;
    const contentType = _.get(options, 'contentType', 'application/octet-stream');
    const response = await contentClient.uploadContentStreaming(options.project || profile.project, profile.token, contentKey, filePath, showProgress, contentType);
    if (response.success) {
        printSuccess('Content successfully uploaded.', options);
    } else {
        const message = `Failed to upload content ${filePath}: ${response.status} ${response.message}`;
        printNormalizedError(response, options, `Failed to upload content ${filePath}`, exit);
        throw Error(message); // Temp fix to make recursive upload stop uploading, until uploadContentStreaming() throws
    }
}

export class ListContent {
    constructor(program) {
        this.program = program;
    }

    async execute(options) {
        const profile = await loadProfile(options.profile);
        debug('%s.listContent()', profile.name);
        const content = new Content(profile.url);
        content.listContent(options.project || profile.project, profile.token, options.prefix).then((response) => {
            if (response.success) {
                const result = response.message;
                // TODO remove --query on deprecation
                if (options.json || options.query) {
                    getFilteredOutput(result, options);
                } else {
                    const tableSpec = [
                        { column: 'Key', field: 'Key', width: 70 },
                        { column: 'Content Type', field: 'ContentType', width: 30 },
                        { column: 'Last Modified', field: 'LastModified', width: 30 },
                        { column: 'Size (bytes)', field: 'Size', width: 20 },
                    ];
                    handleTable(tableSpec, response.message, null, 'No content found');
                }
            } else {
                printError(`Failed to list content: ${response.status} ${response.message}`, options);
            }
        })
            .catch((err) => {
            debug(err);
            printError(`Failed to list content: ${err.status} ${err.message}`, options);
        });
    }
}
export class UploadContent {
    constructor(program) {
        this.program = program;
    }

    async execute(contentKey, filePath, options) {
        const profile = await loadProfile(options.profile);
        const project = options.project || profile.project;
        checkProject(project);
        debug('%s.uploadContent()', profile.name);
        const contentClient = new Content(profile.url);
        const chunkSize = parseInt(options.chunkSize, 10);
        if (options.recursive) {
            const files = getSourceFiles(filePath);
            // if (err) {
            //     debug(err);
            //     printError(`Failed to upload content: ${err.status} ${err.message}`, options);
            // }
            const totalBytes = files.reduce((accum, current) => {
                console.log(`${humanReadableFileSize(current.size)}\t${current.relative} -> ${contentKey}/${current.relative}`);
                return accum + current.size;
            }, 0);
            console.log(`\nTotal:\n${humanReadableFileSize(totalBytes)}\t${filePath}`);
            debug(`chunksize ${chunkSize}`);
            if (!options.test) {
               return PromisePool
                    .withConcurrency(chunkSize)
                    .for(files)
                    .handleError((err, item, pool) => {
                        pool.stop();
                        process.exit(1);
                    })
                    .process(async (item) => {
                        // TODO progress
                        await upload(contentClient, profile, options, `${contentKey}/${item.relative}`, item.canonical, false);
                    });
            }
            return console.log('Test option set. Nothing uploaded.');
        }
        return upload(contentClient, profile, options, contentKey, filePath);
    }
}
export class DeleteContent {
    constructor(program) {
        this.program = program;
    }

    async execute(contentKey, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.deleteContent()', profile.name);
        const content = new Content(profile.url);
        content.deleteContent(options.project || profile.project, profile.token, contentKey).then((response) => {
            if (response.success) {
                printSuccess('Content successfully deleted.', options);
            } else {
                printError(`Failed to delete content: ${response.status} ${response.message}`, options);
            }
        })
            .catch((err) => {
            debug(err);
            printError(`Failed to delete content: ${err.status} ${err.message}`, options);
        });
    }
}
export class DownloadContent {
    constructor(program) {
        this.program = program;
    }

    async execute(contentKey, options) {
        const profile = await loadProfile(options.profile);
        debug('%s.DownloadContent()', profile.name);
        const content = new Content(profile.url);
        const showProgress = !!options.progress;
        content.downloadContent(options.project || profile.project, profile.token, contentKey, showProgress).catch((err) => {
            debug(err);
            printNormalizedError(err, options, `Failed to download content`)
        });
    }
}
