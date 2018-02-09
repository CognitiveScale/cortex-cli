#!/bin/bash -eu

IMAGE_NAME='c12e/cortex-cli'
IMAGE_TAG='latest-cortex-dev'
FQ_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# TODO check docker version/user permissions to docker daemon?
echo "Checking for docker"
which docker || (echo "Please ensure Docker is installed" && exit 1)

INSTALL_DIR='/usr/local/bin'
#echo "Please specify the location to install cortex, default: ${INSTALL_DIR}"
#read INSTALL_DIR
#if [[ -z "${INSTALL_DIR}" ]]; then
#  INSTALL_DIR='/tmp'
#  INSTALL_DIR='/usr/local/bin'
#fi

echo "Removing existing installation (if it exists)"
# ensure installation directory exists
mkdir -p ${INSTALL_DIR}
# ensure cortex file path doesn't exist (could cause problems if it's a directory)
rm -rf ${INSTALL_DIR}/cortex
# remove existing configuration if exists
rm -rf ~/.cortex

docker pull ${FQ_IMAGE_NAME}
docker run --rm ${FQ_IMAGE_NAME} bootstrap > ${INSTALL_DIR}/cortex
chmod +x ${INSTALL_DIR}/cortex

# Add install dir to $PATH in ~/.bash_profile
# TODO check if line already exists in ~/.bash_profile, not just in path
which cortex || echo "export PATH=${PATH}:${INSTALL_DIR}" >> ~/.bash_profile

echo "Please open a new terminal or run 'source ~/.bash_profile' in your current terminal window to activate these changes"