#!/bin/bash -eu

# Copied from: https://bitbucket.org/cognitivescale/cortex-console/src

IMAGE_NAME=$(git remote -v | grep "(fetch)" | sed -E "s/.*git@.*:.*\/(.*)\.git.*/\1/")
BRANCH=$(git symbolic-ref --short -q HEAD)
VERSION=$(git describe --long --always --dirty --match='v*.*' | sed 's/v//; s/-/./')

function error_exit {
    echo "$1" >&2   ## Send message to stderr. Exclude >&2 if you don't want it that way.
    exit "${2:-1}"  ## Return a code specified by $2 or 1 by default.
}

function local_build(){
    npm install || error_exit "Failed to run npm install"
    echo ${VERSION} > version.txt
}

# This runs on host os e.g MAC/Windows
function local_docker(){
    DOCKER_NAME_SPACE=${DOCKER_NAME_SPACE-"c12e"}
    docker rmi "${DOCKER_NAME_SPACE}/${IMAGE_NAME}:${BRANCH}" || echo "old image not cleaned up..."
    docker build --rm -f Dockerfile.c12e-ci.${IMAGE_NAME} -t "${DOCKER_NAME_SPACE}/${IMAGE_NAME}:${BRANCH}" .
    docker tag ${DOCKER_NAME_SPACE}/${IMAGE_NAME}:${BRANCH} ${DOCKER_NAME_SPACE}/${IMAGE_NAME}:latest
}

# This runs inside a linux docker container
function docker_build(){
    npm config set loglevel warn
    npm cache clear --force
    npm install -dd --verbose
    echo ${VERSION} > version.txt

    BRANCH=$(git symbolic-ref --short -q HEAD)
    if [[ ${BRANCH} = "master" ]]; then
        rm -rf node_modules
        npm install --silent --only=production
#        npm publish
#    elif [[ ${BRANCH} = "develop" ]]; then
#        npm publish --tag develop
    fi
}

## MAIN
cd "$(dirname "$0")"
echo "##### BUILDING BRANCH[${BRANCH}],VERSION[${VERSION}] of IMAGE[${IMAGE_NAME}] ######"
case ${1-local} in
    CI)
        docker_build
        ;;
    *)
        local_build
        local_docker
        ;;
esac
