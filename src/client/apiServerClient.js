const _ = require('lodash');
const { GraphQLClient, gql } = require('graphql-request');

module.exports = class ApiServerClient {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/fabric/v4/graphql`;
    }

    _client(token) {
        return new GraphQLClient(this.endpoint, {
            headers: {
                Authorization: `bearer ${token}`,
            },
            redirect: 'error',
        });
    }

    /**
     * Query project using graphql
     * @param projectId
     * @return {Promise<any>}
     */
    async getProject(token, projectId) {
        try {
            const fetched = await this._client(token)
                .request(gql`query { projectByName( name: "${projectId}" ){name, title, description}}`);
            return _.get(fetched, 'projectByName');
        } catch (err) {
            throw err;
        }
    }


    /**
     * Query project using graphql
     * @param projectId
     * @return {Promise<any>}
     */
    async listProjects(token) {
        try {
            const fetched = await this._client(token)
                .request(gql`{ projects { name, title, description} }`);
            return _.get(fetched, 'projects', []);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Query project using graphql
     * @param projectId
     * @return {Promise<any>}
     */
    async createProject(token, projDef) {
        try {
            const fetched = await this._client(token)
                .request(gql`mutation NewProject($input: CreateProjectInput!) { createProject(input: $input){name}}`, { input: projDef });
            return _.get(fetched, 'createProject', {});
        } catch (err) {
            throw err;
        }
    }

    /**
     * Fetch campaign using graphql
     * @paa
     * @param campaignId
     * @return {Promise<any>}
     */
    async getCampaign(projectId, token, campaignId) {
        try {
            const fetched = await this._client(token)
                .request(gql`query { campaignByName( project: "${projectId}", name: "${campaignId}" ){name, title, description}}`);
            return _.get(fetched, 'campaignByName');
        } catch (err) {
            throw err;
        }
    }


    /**
     * Query campaign using graphql
     * @param campaignId
     * @return {Promise<any>}
     */
    async listCampaigns(projectId, token) {
        try {
            const fetched = await this._client(token)
                .request(gql`{ campaigns ( project: "${projectId}" ) { name, title, description} }`);
            return _.get(fetched, 'campaigns', []);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Query model list using graphql
     * @param projectId, offset, limit
     * @return {Promise<any>}
     */
    async listModels(projectId, offset, limit, token) {
        try {
            const fetched = await this._client(token)
                .request(gql`{ models ( project: "${projectId}", offset: ${offset}, limit: ${limit} ) { name, title, description } }`);
            return _.get(fetched, 'models', []);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Query model description using graphql
     * @param projectId, name
     * @return {Promise<any>}
     */
    async descModels(projectId, name, token) {
        try {
            const fetched = await this._client(token)
                .request(gql`{ modelByName ( project: "${projectId}", name: "${name}" ) { name, description, model_mode, source, status, title, type } }`);
            return _.get(fetched, 'models', []);
        } catch (err) {
            throw err;
        }
    }
};
