import { assert } from 'chai';
import Actions from '../src/client/actions.js';

const action = new Actions('https://api.cortex-dev.insights.ai');
describe('_cortexRegistryImagePath()', () => {
    it('returns the full URL of the image in the private registry', () => {
        const registryUrl = 'private-registry.cortex.insights.ai';
        const tenant = 'tenant';
        const i1 = 'image';
        const i2 = 'c12e/image';
        const i3 = 'docker.io/library/image';
        const t1 = 'image:1234';
        const t2 = 'c12e/image:1234';
        const t3 = 'docker.io/library/image:1234';
        [i1, i2, i3].forEach((i) => {
            assert.equal(action._cortexRegistryImagePath(registryUrl, i, tenant), 'private-registry.cortex.insights.ai/tenant/image');
        });
        [t1, t2, t3].forEach((i) => {
            assert.equal(action._cortexRegistryImagePath(registryUrl, i, tenant), 'private-registry.cortex.insights.ai/tenant/image:1234');
        });
    });
});
