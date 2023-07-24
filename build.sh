#!/bin/bash -eux

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
    export CI="script"
    apt-get update
    apt-get install -y apt-utils libsecret-1-dev
    # Grab signing util for MACOS
    mkdir /tmp/macsign
    OPWD=$PWD
    cd /tmp/macsign
    wget https://github.com/xerub/ldid/releases/download/42/ldid.zip
    echo "b93efbc32136cf2778bfe7191dc2a7fb  ldid.zip" > ldid.md5
    md5sum -c ldid.md5
    unzip ldid.zip
    cd $OPWD
    export PATH=$PATH:/tmp/macsign/linux64
    npm ci --unsafe-perm --userconfig=/root/.npmrc --ignore-scripts
    npm rebuild
    npm test
    echo ${VERSION} > version.txt
    ./generate_docs.sh
    BRANCH=$(git symbolic-ref --short -q HEAD)
    if [[ ${BRANCH} = "main" ]]; then
#        TODO this should maybe be done as part of the gocd pipeline?.. or maybe get in the habit of pushing alpha versions to npm just like we do for cortex-python?..
        npm publish --registry=https://registry.npmjs.org/
    elif [[ ${BRANCH} = "develop" ]]; then
        npm config set always-auth true
#        npm publish --tag "${BRANCH}" --registry=https://cognitivescale.jfrog.io/artifactory/api/npm/npm-local/
    fi
    npm pack .
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
