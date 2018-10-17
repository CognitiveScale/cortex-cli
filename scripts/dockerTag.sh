#!/bin/bash -eu

# PREREQS
#  - Login against the secured docker registry with JWT as the password, docker login private-registry.${CORTEX_ENV}.insights.ai

###
#
#  USAGE: ./dockerTag.sh <dockerhubOrg> <dockerImageNameAndTag> <cortexTenant> [<cortexDeployment>]
#    Ex. ./dockerTag.sh c12e ansible:latest colttest cortex-dev 
#
###


# Organization/User Namespace in DockerHub
DOCKERHUB_ORG=${1:-c12e}
# Image name published to DockerHub
# The image name and tag that exists in DockerHub
IMAGE=${2:-ansible}
# The Cortex account/tenant name 
TENANT_NAME=${3:-company}
# The Cortex deployment that the tenant exists in, should be not needed for PROD
CORTEX_ENV=${4:-cortex}
SECURED_REGISTRY=private-registry.${CORTEX_ENV}.insights.ai

echo "Attempting to pull '${DOCKERHUB_ORG}/${IMAGE}' from hub.docker.com"
docker pull ${DOCKERHUB_ORG}/${IMAGE} || (echo "Unable to pull '${DOCKERHUB_ORG}/${IMAGE}'" && exit 1)

echo "Retagging '${DOCKERHUB_ORG}/${IMAGE}' as '${SECURED_REGISTRY}/${TENANT_NAME}/${IMAGE}'"
docker tag ${DOCKERHUB_ORG}/${IMAGE} ${SECURED_REGISTRY}/${TENANT_NAME}/${IMAGE}

echo "Pushing '${SECURED_REGISTRY}/${TENANT_NAME}/${IMAGE}'"
docker push ${SECURED_REGISTRY}/${TENANT_NAME}/${IMAGE} || (echo "Unable to push '${SECURED_REGISTRY}/${TENANT_NAME}/${IMAGE}', Are you sure you logged in?" && exit 1)

