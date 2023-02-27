import fs from 'node:fs';
import process from 'node:process';
import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { createFileStream, constructError, checkProject } from '../commands/utils.js';

const debug = debugSetup('cortex:cli');
export default (class Content {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/content`;
    }

    _sanitizeKey(key) {
        // strip leading slash, if any
        return key.replace(/^\//, '');
    }

    listContent(projectId, token, prefix) {
        checkProject(projectId);
        const endpoint = this.endpoint(projectId);
        debug('listContent() => %s', endpoint);
        const query = {};
        if (prefix) query.filter = prefix;
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
            searchParams: query,
        }).json()
            .then((message) => ({ success: true, message }))
            .catch((err) => constructError(err));
    }

    // eslint-disable-next-line no-unused-vars
    async uploadContentStreaming(projectId, token, key, content, showProgress = false, contentType = 'application/octet-stream') {
        checkProject(projectId);
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projectId)}/${contentKey}`;
        // todo show progress..
        debug('uploadContentStreaming(%s, %s) => %s', key, content, endpoint);
        try {
            const message = await pipeline(fs.createReadStream(content), got.stream.post(endpoint, {
                headers: defaultHeaders(token, { 'Content-Type': contentType }),
            }), 
            // https://github.com/sindresorhus/got/blob/HEAD/documentation/3-streams.md#stream-api
            // new stream.PassThrough() is required to catch errors.
            new PassThrough());
            return { success: true, message };
        } catch (err) {
            return constructError(err);
        }
    }

    deleteContent(projectId, token, key) {
        checkProject(projectId);
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projectId)}/${contentKey}`;
        debug('deleteContent() => %s', endpoint);
        return got
            .delete(endpoint, {
            headers: defaultHeaders(token),
        }).json()
            .then((message) => ({ success: true, message }))
            .catch((err) => constructError(err));
    }

    // TODO progress
    // eslint-disable-next-line no-unused-vars
    downloadContent(projectId, token, key, showProgress = false, toFile = null) {
        checkProject(projectId);
        const contentKey = this._sanitizeKey(key);
        const endpoint = `${this.endpoint(projectId)}/${contentKey}`;
        debug('downloadContent() => %s', endpoint);
        try {
            let toFileStream;
            if (toFile) {
                toFileStream = createFileStream(toFile);
            } else {
                toFileStream = process.stdout;
            }
            return pipeline(got.stream(endpoint, { headers: defaultHeaders(token) }), toFileStream);
        } catch (err) {
            return constructError(err);
        }
    }
});
