// ToDo: move to cortex-express-common when adding server side validations FAB-4008
module.exports.ALLOWED_QUERY_FIELDS = {
    SKILL: {
        filter: ['name', 'title', 'description', 'createdBy'],
        sort: ['name', 'title', 'description', 'createdAt', 'createdBy', 'updatedAt'],
    },
    AGENT: {
        filter: ['name', 'title', 'description', 'createdBy'],
        sort: ['name', 'title', 'description', 'createdAt', 'createdBy', 'updatedAt'],
    },
    ACTION: {
        filter: ['name', 'title', 'type', 'image', 'description', 'createdBy'],
        sort: ['name', 'title', 'type', 'image', 'description', 'createdAt', 'createdBy', 'updatedAt'],
    },
    SNAPSHOT: {
        filter: ['snapshotId', 'title', '_isTip', '_createdBy'],
        sort: ['snapshotId', 'title', '_isTip', '_createdAt', '_createdBy', '_updatedAt'],
    },
    ASSESSMENT: {
        filter: ['name', 'title', 'componentName', 'reportCount', '_createdBy'],
        sort: ['name', 'title', 'componentName', 'reportCount', '_createdBy', '_updatedAt'],
    },
    TYPE: {
        filter: ['name', 'title', 'description', 'createdBy'],
        sort: ['name', 'title', 'description', 'createdAt', 'createdBy', 'updatedAt'],
    },
    CONNECTION: {
        filter: ['name', 'title', 'description', 'createdBy', 'connectionType', 'allowWrite', 'contentType'],
        sort: ['name', 'title', 'description', 'createdAt', 'connectionType', 'allowWrite', 'contentType', 'updatedAt'],
    },
    CONNECTION_TYPE: {
        filter: ['name', 'title', 'description', 'type', 'group'],
        sort: ['name', 'title', 'description', 'type', 'group'],
    },
    RESOURCE: {
        filter: ['name', 'title', 'type', '_projectId'],
        sort: ['resourceName', 'resourceTitle', 'resourceType', '_projectId'],
    },
    EXPERIMENT: {
        filter: ['name', 'title', 'description', 'modelId'],
        sort: ['name', 'title', 'description', 'modelId', 'createdAt', 'updatedAt'],
    },
    RUN: {
        filter: ['runId', '_createdAt', 'startTime', 'endTime', 'took', 'experimentName'],
        sort: ['runId', '_createdAt', 'startTime', 'endTime', 'took', 'experimentName', '_updatedAt'],
    },
    MODEL: {
        filter: ['name', 'title', 'description', 'createdBy', 'type', 'status'],
        sort: ['name', 'title', 'description', 'createdAt', 'updatedAt', 'createdBy', 'type', 'status'],
    },
    CAMPAIGN: {
        filter: ['name', 'title', 'description', '_createdBy', 'lifecycleState'],
        sort: ['name', 'title', 'description', '_createdAt', '_createdBy', 'lifecycleState', '_updatedAt'],
    },
    MISSION: {
        filter: ['name', 'title', 'description', '_createdBy', 'lifecycleState'],
        sort: ['name', 'title', 'description', '_createdAt', '_createdBy', 'lifecycleState', '_updatedAt'],
    },
    PROJECT: {
        filter: ['name', 'title', 'description'],
        sort: ['name', 'title', 'description', '_createdAt', '_updatedAt'],
    },
    ACTIVATION: {
        filter: ['status', 'start', 'end', 'skillName', 'agentName'],
        sort: ['status', 'start', 'end', 'skillName', 'agentName'],
    },
};

module.exports.DEFAULT_LIST_LIMIT_COUNT = '20';

module.exports.DEFAULT_LIST_SKIP_COUNT = '0';

module.exports.DEFAULT_LIST_SORT_PARAMS = {
    updatedAt: 'updatedAt', // skills, agents, actions, connections, models, experiments, types,
    _updatedAt: '_updatedAt', // projects, missions, campaigns, run, assessment, snapshot
    start: 'start', // activations
};

module.exports.LIST_JSON_HELP_TEXT = 'Output results in JSON, supports JMESPath query to filter the response data';

module.exports.QUERY_JSON_HELP_TEXT = 'A JMESPath query to use in filtering the response data';

module.exports.GET_DEFAULT_SORT_CLI_OPTION = (param) => JSON.stringify({ [param]: -1 });
