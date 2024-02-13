import _ from 'lodash';
import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { checkProject, printWarning } from '../commands/utils.js';
import dockerCli from './dockerClient.js';

const debug = debugSetup('cortex:cli');
export default class Actions {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpointV4 = (projectId) => `${cortexUrl}/fabric/v4/projects/${projectId}/actions`;
    }

    async deployAction(projectId, token, actionInst) {
        checkProject(projectId);
        let endpoint = this.endpointV4(projectId);
        if (actionInst.actionType) {
            endpoint = `${endpoint}?actionType=${actionInst.actionType}`;
        }
        debug('deployAction(%s, docker=%s, ttl=%s) => %s', actionInst.name, actionInst.image, actionInst.ttl, endpoint);
        const body = { ...actionInst };
        // image & docker floating around fixup just in case.
        if (body.docker) {
            body.image = body.docker;
            delete body.docker;
        }
        try {
            body.docker = await this._maybePushDockerImage(actionInst.image, token, actionInst.pushDocker);
        } catch (error) {
            return { success: false, status: 400, message: error.message || error };
        }
        return got
            .post(endpoint, {
            headers: defaultHeaders(token),
            json: body,
        }).json();
    }

    listActions(projectId, token, filter, limit, skip, sort) {
        checkProject(projectId);
        debug('listActions() => %s', this.endpointV4(projectId));
        const query = {};
        if (filter) query.filter = filter;
        if (limit) query.limit = limit;
        if (sort) query.sort = sort;
        if (skip) query.skip = skip;
        return got
            .get(this.endpointV4(projectId), {
            headers: defaultHeaders(token),
            searchParams: query,
        }).json();
    }

    describeAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}`;
        debug('describeAction(%s) => %s', actionName, endpoint);
        return got
            .get(endpoint, { headers: defaultHeaders(token) })
            .json();
    }

    getLogsAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}/logs`;
        debug('getLogsAction(%s) => %s', actionName, endpoint);
        return got
            .get(endpoint, { headers: defaultHeaders(token) })
            .json();
    }

    deleteAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}`;
        debug('deleteAction(%s) => %s', actionName, endpoint);
        return got
            .delete(endpoint, {
            headers: defaultHeaders(token),
        })
            .json();
    }

    getConfig(projectId, token) {
        checkProject(projectId);
        const endpoint = _.join([this.endpointV4(projectId), '_config'], '/');
        debug('getConfig() => %s', endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        })
            .json();
    }

    static getCanonicalJobId(jobId) {
        let canonicalJobId = jobId;
        const namespaceProvided = /\w\/\w/.test(jobId);
        if (namespaceProvided) {
            canonicalJobId = encodeURIComponent(jobId);
        }
        return canonicalJobId;
    }

    async _cortexRegistryUrl(token) {
        const res = await this.getConfig(token);
        if (res.success) return res.config.dockerPrivateRegistryUrl;
        throw res;
    }

    _cortexRegistryImagePath(registryUrl, imageRepo, tenant) {
        const imageName = _.split(imageRepo, '/').slice(-1)[0];
        return _.join([registryUrl, tenant, imageName], '/');
    }

    async _maybePushDockerImage(image, token, pushDocker) {
        // This is a helper to push a local or remote image to a private registry
        if (!image || !pushDocker) {
            return image;
        }
        const registryUrl = await this._cortexRegistryUrl(token);
        const imageName = image.replace(/.+\..+\//, '');
        const cortexImageUrl = this._cortexRegistryImagePath(registryUrl, imageName, '');
        // TODO support non cortex registry !!
        await dockerCli().login(registryUrl, 'cli', token);
        try {
            await dockerCli()
                .pull(image);
        } catch (err) {
            printWarning(`Docker pull failed using local image: ${err.message}`);
        }
        await dockerCli().tag(image, cortexImageUrl);
        await dockerCli().push(cortexImageUrl);
        return cortexImageUrl;
    }
}
