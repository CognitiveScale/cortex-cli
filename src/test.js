import getClient from './client/dockerClient.js';

const docker = getClient();

console.log(await docker.listImages('registry.k8s.io/pause'));
