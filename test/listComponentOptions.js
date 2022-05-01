const assert = require('assert');

const { validateOptions } = require('../src/commands/utils');

describe('List model command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"name": "test"}',
            sort: '{"createdAt": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'MODEL');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'MODEL');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,createdBy,type,status') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,createdAt,updatedAt,createdBy,type,status') === true,
            'Is invalid sort');
    });
});

describe('List experiments command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"modelId": "test"}',
            sort: '{"createdAt": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'EXPERIMENT');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'EXPERIMENT');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,modelId') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,modelId,createdAt,updatedAt') === true,
            'Is invalid sort');
    });
});

describe('List runs command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"runId": "test"}',
            sort: '{"_createdAt": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'RUN');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'RUN');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: runId,_createdAt,startTime,endTime,took,experimentName') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: runId,_createdAt,startTime,endTime,took,experimentName') === true,
            'Is invalid sort');
    });
});

describe('List actions command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"image": "test"}',
            sort: '{"type": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'ACTION');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'ACTION');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,type,image,description,createdBy') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,type,image,description,createdAt,createdBy') === true,
            'Is invalid sort');
    });
});

describe('List agents command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"name": "test"}',
            sort: '{"createdBy": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'AGENT');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'AGENT');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,createdBy') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,createdAt,createdBy') === true,
            'Is invalid sort');
    });
});

describe('List skill command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"name": "test"}',
            sort: '{"createdBy": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'SKILL');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'SKILL');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,createdBy') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,createdAt,createdBy') === true,
            'Is invalid sort');
    });
});

describe('List types command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"name": "test"}',
            sort: '{"createdBy": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'TYPE');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'TYPE');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,createdBy') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,createdAt,createdBy') === true,
            'Is invalid sort');
    });
});

describe('List snapshot command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"snapshotId": "test"}',
            sort: '{"_isTip": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'SNAPSHOT');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'SNAPSHOT');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: snapshotId,title,_isTip,_createdBy') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: snapshotId,title,_isTip,_createdAt,_createdBy') === true,
            'Is invalid sort');
    });
});

describe('List assessments command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"componentName": "test"}',
            sort: '{"reportCount": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'ASSESSMENT');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'ASSESSMENT');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,componentName,reportCount,_createdBy') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,componentName,reportCount,_createdBy,_updatedAt') === true,
            'Is invalid sort');
    });
});

describe('List resources command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"name": "test"}',
            sort: '{"resourceType": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'RESOURCE');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'RESOURCE');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,type,_projectId') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: resourceName,resourceTitle,resourceType,_projectId') === true,
            'Is invalid sort');
    });
});

describe('List connections command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"connectionType": "test"}',
            sort: '{"allowWrite": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'CONNECTION');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'CONNECTION');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,createdBy,connectionType,allowWrite,contentType') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,createdAt,connectionType,allowWrite,contentType') === true,
            'Is invalid sort');
    });
});

describe('List connection types command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"type": "test"}',
            sort: '{"group": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'CONNECTION_TYPE');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'CONNECTION_TYPE');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,type,group') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,type,group') === true,
            'Is invalid sort');
    });
});

describe('List campaigns command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"lifecycleState": "test"}',
            sort: '{"name": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'CAMPAIGN');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'CAMPAIGN');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,_createdBy,lifecycleState') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,_createdAt,_createdBy,lifecycleState') === true,
            'Is invalid sort');
    });
});

describe('List missions command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"lifecycleState": "test"}',
            sort: '{"name": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'MISSION');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'MISSION');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description,_createdBy,lifecycleState') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,_createdAt,_createdBy,lifecycleState') === true,
            'Is invalid sort');
    });
});

describe('List projects command option check', () => {
    it('should pass for valid filter and sort params', () => {
        const options = {
            filter: '{"name": "test"}',
            sort: '{"_createdAt": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'PROJECT');
        assert.ok(validOptions === true, 'Valid options');
        assert.ok(errorDetails.length === 0, 'Valid options');
    });

    it('should fail for invalid filter and sort params', () => {
        const options = {
            filter: '{"key1": "test"}',
            sort: '{"key2": 1}',
            limit: 1,
            skip: 0,
        };
        const { validOptions, errorDetails } = validateOptions(options, 'PROJECT');
        assert.ok(validOptions === false, 'Invalid options');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid filter params. Allowed fields: name,title,description') === true,
            'Is invalid filter');
        assert.ok(JSON.stringify(errorDetails).includes(
            'Invalid sort params. Allowed fields: name,title,description,_createdAt') === true,
            'Is invalid sort');
    });
});

