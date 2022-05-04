const _ = require('lodash');
const { GraphQLClient, gql } = require('graphql-request');
const { defaultHeaders } = require('./apiutils');

module.exports = class ApiServerClient {
    constructor(cortexUrl) {
        this.cortexUrl = cortexUrl;
        this.endpoint = `${cortexUrl}/fabric/v4/graphql`;
    }

    _client(token) {
        return new GraphQLClient(this.endpoint, {
            headers: defaultHeaders(token),
            redirect: 'error',
        });
    }

    /**
     * Query project using graphql
     * @param token
     * @param projectId
     * @return {Promise<any>}
     */
    async getProject(token, projectId) {
        const fetched = await this._client(token)
            .request(gql`query { projectByName( name: "${projectId}" ){name, title, description}}`);
        return _.get(fetched, 'projectByName');
    }

    /**
     * Query project using graphql
     * @param token
     * @return {Promise<any>}
     */
    async listProjects(token, filter, limit, skip, sort) {
        const fetched = await this._client(token)
            .request(gql`{
            projects ( filter: "${filter}", limit: "${limit}",  skip: "${skip}",  sort: "${sort}" ) { name, title, description} }
        `);
        return _.get(fetched, 'projects', []);
    }

    /**
     * Query project using graphql
     * @param token
     * @param projDef
     * @return {Promise<any>}
     */
    async createProject(token, projDef) {
        const fetched = await this._client(token)
            .request(gql`mutation NewProject($input: CreateProjectInput!) { createProject(input: $input){name}}`, { input: projDef });
        return _.get(fetched, 'createProject', {});
    }


    /**
     * Delete project using graphql
     * @param token
     * @param projectId
     * @return {Promise<any>}
     */
    async deleteProject(token, projectId) {
        const fetched = await this._client(token)
            .request(gql`mutation { deleteProject(name: "${projectId}") }`);
        return _.get(fetched, 'deleteProject', {});
    }

    /**
     * Fetch campaign using graphql
     * @param projectId
     * @param token
     * @param campaignId
     * @return {Promise<any>}
     */
    async getCampaign(projectId, token, campaignId) {
        const fetched = await this._client(token)
            .request(gql`query { campaignByName( project: "${projectId}", name: "${campaignId}" ){name, title, description}}`);
        return _.get(fetched, 'campaignByName');
    }

    /**
     * Query campaign using graphql
     * @param projectId
     * @param token
     * @return {Promise<any>}
     */
    async listCampaigns(projectId, token, filter, limit, skip, sort) {
        const fetched = await this._client(token)
            .request(gql`{ campaigns ( project: "${projectId}", filter: "${filter}", limit: "${limit}",  skip: "${skip}",  sort: "${sort}" ) { name, title, description} }`);
        return _.get(fetched, 'campaigns', []);
    }

    /**
     * Query model list using graphql
     * @param projectId
     * @param offset
     * @param limit
     * @param token
     * @return {Promise<any>}
     */
    async listModels(projectId, offset, limit, token) {
        const fetched = await this._client(token)
            .request(gql`{ models ( project: "${projectId}", offset: ${offset}, limit: ${limit} ) { name, title, description } }`);
        return _.get(fetched, 'models', []);
    }

    /**
     * Query model description using graphql
     * @param projectId
     * @param name
     * @param token
     * @return {Promise<any>}
     */
    async descModels(projectId, name, token) {
        const fetched = await this._client(token)
            .request(gql`{ modelByName ( project: "${projectId}", name: "${name}" ) { name, description, model_mode, source, status, title, type } }`);
        return _.get(fetched, 'modelByName', []);
    }
};
