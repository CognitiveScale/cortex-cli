import debugSetup from 'debug';
import which from 'which';
import { callMe, printError } from '../commands/utils.js';

const debug = debugSetup('cortex:cli');

/**
 * Interface for docker clients
 */
let currentClient;
/*
   Will likely remove this in favor of third party clients as this is missing many features
 */

class DockerCli {
    async login(registryUrl, user, password) {
        const command = `docker login -u ${user} --password ${password} ${registryUrl}`;
        debug('%s', command);
        await callMe(command, () => {}); // suppress warnings
        return 'Login Succeeded';
    }

    async build(opts) {
        const {
 imageTag, dockerFile, contextPath, stdoutHandler, 
} = opts;
        // TODO --platform=amd64,arm64,darwin/arm64
        const command = `docker build --progress plain --tag ${imageTag} -f ${dockerFile} ${contextPath}`;
        debug('%s', command);
        return callMe(command, stdoutHandler);
    }

    pull(image) {
        const command = `docker pull ${image}`;
        debug('%s', command);
        return callMe(command);
    }

    tag(source, target) {
        const command = `docker tag ${source} ${target}`;
        debug('%s', command);
        return callMe(command);
    }

    push(image) {
        const command = `docker push ${image}`;
        debug('%s', command);
        return callMe(command);
    }

    async listImages(image = undefined) {
        const command = `docker images ${image ?? ''} --format json`;
        const lines = [];
        await callMe(command, (s) => {
            if (s.startsWith('{')) lines.push(s);
        });
        const str = lines.join();
        const images = [];
        str.split('\n').forEach((l) => { if (l.startsWith('{')) images.push(JSON.parse(l)); });
        return images;
    }
}

class NerdCtl {
    async login(registryUrl, user, password) {
        const command = `nerdctl login -u ${user} --password ${password} ${registryUrl}`;
        debug('%s', command);
        await callMe(command, () => {}); // suppress warnings
        return 'Login Succeeded';
    }

    async build(opts) {
        const { imageTag, dockerFile, contextPath } = opts;
        // TODO namespace
        // TODO --platform=amd64,arm64,darwin/arm64
        const command = `nerdctl build --output type=image,name=${imageTag} -f ${dockerFile} ${contextPath}`;
        debug('%s', command);
        return callMe(command);
    }

    tag(source, target) {
        const command = `nerdctl tag ${source} ${target}`;
        debug('%s', command);
        return callMe(command);
    }

    pull(image) {
        const command = `nerdctl pull ${image}`;
        debug('%s', command);
        return callMe(command);
    }

    push(image) {
        const command = `nerdctl push ${image}`;
        debug('%s', command);
        return callMe(command);
    }

    async listImages(image = undefined) {
        const command = `nerdctl images ${image ?? ''} --format json`;
        const lines = [];
        await callMe(command, (s) => {
            if (s.startsWith('{')) lines.push(s);
        });
        const str = lines.join();
        const images = [];
        str.split('\n').forEach((l) => { if (l.startsWith('{')) images.push(JSON.parse(l)); });
        return images;
    }
}

class PodMan {
    async login(registryUrl, user, password) {
        // TODO validate this
        const command = `podman login -u ${user} --password ${password} ${registryUrl}`;
        debug('%s', command);
        await callMe(command, () => {}); // suppress warnings
        return 'Login Succeeded';
    }

    async build() {}

    tag(source, target) {
        const command = `podman tag ${source} ${target}`;
        debug('%s', command);
        return callMe(command);
    }

    pull(image) {
        const command = `podman pull ${image}`;
        debug('%s', command);
        return callMe(command);
    }

    push(image) {
        const command = `podman push ${image}`;
        debug('%s', command);
        return callMe(command);
    }

    async listImages(image = undefined) {
        const command = `podman images ${image ?? ''} --format json`;
        const lines = [];
        await callMe(command, (s) => {
            if (s.startsWith('{')) lines.push(s);
        });
        const str = lines.join();
        const images = [];
        str.split('\n').forEach((l) => { if (l.startsWith('{')) images.push(JSON.parse(l)); });
        return images;
    }
}

const SUPPORTED_CLIS = { docker: DockerCli, nerdctl: NerdCtl, podman: PodMan };
export default function getClient(opts = {}) {
    const { dockerCli } = opts;
    if (currentClient) return currentClient;
    // TODO add client to profile || support environment variable
    // TODO add namespace support ( podman & nerdctl )
    if (dockerCli) {
        debug(`User specified docker client ${dockerCli}`);
        const found = Object.keys(SUPPORTED_CLIS).find((e) => e === dockerCli?.toLowerCase());
        if (!found) {
            printError(`Unsupported docker client "${dockerCli}" use: ${Object.keys(SUPPORTED_CLIS).join(', ')}`);
        }
        const resolved = which.sync(found, { nothrow: true });
        if (!resolved) {
            printError(`Docker client executable "${dockerCli}" not found in PATH`);
        }
        currentClient = new SUPPORTED_CLIS[found](opts);
        return currentClient;
    }
    debug('No docker client specified, checking available ones');
    // If not specified check for supported OCI clients
    Object.entries(SUPPORTED_CLIS).every(([exe, ClientClass]) => {
        const resolved = which.sync(exe, { nothrow: true });
        if (resolved) {
            debug(`Found ${exe} in PATH ${resolved} using ${ClientClass.name} client`);
            currentClient = new ClientClass(opts);
            return false; // break
        }
        return true;
    });
    if (currentClient === undefined) {
        return printError(`No docker client found in PATH, checked ${Object.keys(SUPPORTED_CLIS).join(',')}`);
    }
    return currentClient;
}
