#!/bin/bash -eux

# Copied from: https://bitbucket.org/cognitivescale/cortex-console/src
if [ "$PWD" = "/work" ]; then
    # Needed when using newer git
    git config --global --add safe.directory /work
fi

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
    # libsecrets is needed for keytar node-gyp build
    apt-get update
    apt-get install -y apt-utils libsecret-1-dev
    # Upgrade to NPM 9 to avoid permissions error when running npm as root.
    # Must either be `<7,>8`, but the latest version of npm is NOT
    # supported with Node 16 (node runtime for CLI). See: https://stackoverflow.com/questions/70952903/npm-error-eacces-permission-denied-scandir
    npm install -g npm@9.9.2
    npm ci --unsafe-perm --userconfig=/root/.npmrc --ignore-scripts
    npm rebuild
    npm test
    npm run scan
    echo ${VERSION} > version.txt
    ./generate_docs.sh
    BRANCH=$(git symbolic-ref --short -q HEAD)
    if [[ ${BRANCH} = "main" ]]; then
#        TODO this should maybe be done as part of the gocd pipeline?.. or maybe get in the habit of pushing alpha versions to npm just like we do for cortex-python?..
        npm publish --registry=https://registry.npmjs.org/
    elif [[ ${BRANCH} = "develop" ]]; then
      echo "skipping plublish to dev npm registry"
#        npm publish --tag "${BRANCH}" --registry=https://cognitivescale.jfrog.io/artifactory/api/npm/npm-local/
    fi
    npm pack .
    mv cortex-cli-*.tgz cortex-cli.tgz
    # NOTE: This script running in a container on the gocd-agent. The coverage
    # report belongs to the (root) user in the container. The pipeline uploads
    # artifacts after the container exists, at which point the script is
    # running as a different user. For some reason, one of the files in the
    # coverage report (coverage/tmp/coverage-<SHA>.json), has 700 permissions,
    # so the pipeline would fail to upload the artifact. Give 755 permissions to
    # allow nested folders to be executable and to allow for artifact upload.
    chmod -R 755 coverage/
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
