test:
		docker run -it -v ${HOME}/.cortex:/root/.cortex --entrypoint bash cortex-cli

build:
		docker build -t cortex-cli:latest -f ./Dockerfile.c12e-ci.cortex-cli .