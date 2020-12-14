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
     * Fetch project using graphql
     * @param token
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
     * List projects using graphql
     * @param token
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
     * Create project using graphql mutation
     * @param token
     * @param project definition object
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
     * Query campaign using graphql
     * @param campaignId
     * @return {Promise<any>}
     */
    async createCampaign(projectId, token, def) {
        try {
            const updatedDef = { ...def, project: projectId };
            const fetched = await this._client(token)
                .request(gql`mutation NewCampaign($input: ProjectInput!) { createProject(input: $input){name}}`, { input: updatedDef });
            return _.get(fetched, 'createProject', {});
        } catch (err) {
            throw err;
        }
    }

    /**
     * Fetch mission using graphql
     * @paa
     * @param missionId
     * @return {Promise<any>}
     */
    async getMission(projectId, token, missionId) {
        try {
            const fetched = await this._client(token)
                .request(gql`query { missionByName( project: "${projectId}", name: "${missionId}" ){name, title, description}}`);
            return _.get(fetched, 'missionByName');
        } catch (err) {
            throw err;
        }
    }


    /**
     * Query mission using graphql
     * @param missionId
     * @return {Promise<any>}
     */
    async listMissions(projectId, token) {
        try {
            const fetched = await this._client(token)
                .request(gql`{ missions (project: "${projectId}"){ name, title, description} }`);
            return _.get(fetched, 'missions', []);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Query mission using graphql
     * @param missionId
     * @return {Promise<any>}
     */
    async createMission(projectId, token, def) {
        try {
            const newdef = { ...def, project: projectId };
            const fetched = await this._client(token)
                .request(gql`mutation NewMission($input: ProjectInput!) { createProject(input: $input){name}}`, { input: newdef });
            return _.get(fetched, 'createProject', {});
        } catch (err) {
            throw err;
        }
    }

};
