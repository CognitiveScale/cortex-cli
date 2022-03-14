// ToDo: move to cortex-express-common when adding server side validations FAB-4008
module.exports.ALLOWED_QUERY_FIELDS = {
    SKILL: {
        filter: ['name', 'title', 'description', 'createdBy'],
        sort: ['name', 'title', 'description', 'createdAt', 'createdBy'],
    },
    AGENT: {
        filter: ['name', 'title', 'description', 'createdBy'],
        sort: ['name', 'title', 'description', 'createdAt', 'createdBy'],
    },
    ACTION: {
        filter: ['name', 'title', 'type', 'image', 'description', 'createdBy'],
        sort: ['name', 'title', 'type', 'image', 'description', 'createdAt', 'createdBy'],
    },
    SNAPSHOT: {
        filter: ['snapshotId', 'title', '_isTip', '_createdBy'],
        sort: ['snapshotId', 'title', '_isTip', '_createdAt', '_createdBy'],
    },
    ASSESSMENT: {
        filter: ['name', 'title', 'componentName', 'reportCount', '_createdBy'],
        sort: ['name', 'title', 'componentName', 'reportCount', '_createdBy', '_updatedAt'],
    },
    TYPE: {
        filter: ['name', 'title', 'description', 'createdBy'],
        sort: ['name', 'title', 'description', 'createdAt', 'createdBy'],
    },
    CONNECTION: {
        filter: ['name', 'title', 'description', 'createdBy', 'connectionType', 'allowWrite', 'contentType'],
        sort: ['name', 'title', 'description', 'createdAt', 'connectionType', 'allowWrite', 'contentType'],
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
        filter: ['runId', 'title', '_createdAt', 'startTime', 'endTime', 'took', 'experimentName'],
        sort: ['runId', 'title', '_createdAt', 'startTime', 'endTime', 'took', 'experimentName'],
    },
    MODEL: {
        filter: ['name', 'title', 'description', 'createdBy', 'type', 'status'],
        sort: ['name', 'title', 'description', 'createdAt', 'updatedAt', 'createdBy', 'type', 'status'],
    },
    CAMPAIGN: {
        filter: ['name', 'title', 'description', '_createdBy', 'lifecycleState'],
        sort: ['name', 'title', 'description', '_createdAt', '_createdBy', 'lifecycleState'],
    },
    MISSION: {
        filter: ['name', 'title', 'description', '_createdBy', 'lifecycleState'],
        sort: ['name', 'title', 'description', '_createdAt', '_createdBy', 'lifecycleState'],
    },
    PROJECT: {
        filter: ['name', 'title', 'description'],
        sort: ['name', 'title', 'description', '_createdAt'],
    },
    ACTIVATION: {
        filter: ['status', 'start', 'end', 'skillName', 'agentName'],
        sort: ['status', 'start', 'end', 'skillName', 'agentName'],
    },
};
