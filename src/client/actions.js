import _ from 'lodash';
import debugSetup from 'debug';
import { got, defaultHeaders } from './apiutils.js';
import { constructError, callMe, checkProject } from '../commands/utils.js';

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
        // image & docker floating around fixup just in case..
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
        }).json()
            .then((res) => ({ success: true, message: res }))
            .catch((err) => constructError(err));
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
        }).json()
            .then((actions) => actions)
            .catch((err) => constructError(err));
    }

    describeAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}`;
        debug('describeAction(%s) => %s', actionName, endpoint);
        return got
            .get(endpoint, { headers: defaultHeaders(token) })
            .json()
            .then((action) => action)
            .catch((err) => constructError(err));
    }

    getLogsAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}/logs`;
        debug('getLogsAction(%s) => %s', actionName, endpoint);
        return got
            .get(endpoint, { headers: defaultHeaders(token) })
            .json()
            .then((logs) => {
            if (_.isArray(logs)) {
                // returns plain array for Rancher daemons
                return { success: true, logs };
            }
            return logs;
        })
            .catch((err) => constructError(err));
    }

    deleteAction(projectId, token, actionName) {
        checkProject(projectId);
        const endpoint = `${this.endpointV4(projectId)}/${encodeURIComponent(actionName)}`;
        debug('deleteAction(%s) => %s', actionName, endpoint);
        return got
            .delete(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((action) => ({ success: true, action }))
            .catch((err) => constructError(err));
    }

    getConfig(projectId, token) {
        checkProject(projectId);
        const endpoint = _.join([this.endpointV4(projectId), '_config'], '/');
        debug('getConfig() => %s', endpoint);
        return got
            .get(endpoint, {
            headers: defaultHeaders(token),
        })
            .json()
            .then((config) => ({ success: true, config }))
            .catch((err) => constructError(err));
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
        if (!image || !pushDocker) {
            return image;
        }
        const registryUrl = await this._cortexRegistryUrl(token);
        const imageName = image.replace(/.+\..+\//, '');
        // const { payload } = jwtVerify(token);
        // TODO fix path
        const cortexImageUrl = this._cortexRegistryImagePath(registryUrl, imageName, '');
        await callMe(`docker login -u cli --password ${token} ${registryUrl}`);
        await callMe(`docker pull ${image} || echo "Docker pull failed using local image"`);
        await callMe(`docker tag ${image} ${cortexImageUrl}`);
        await callMe(`docker push ${cortexImageUrl}`);
        return cortexImageUrl;
    }
}
