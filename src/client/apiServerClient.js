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
                .request(gql`mutation NewProject($input: ProjectInput!) { createProject(input: $input){name}}`, { input: projDef });
            return _.get(fetched, 'createProject', {});
        } catch (err) {
            throw err;
        }
    }
};
