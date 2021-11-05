IMAGE_TAG=latest
SKILL_NAME=$(notdir $(CURDIR))
DOCKER_IMAGE_URL=${DOCKER_PREGISTRY_URL}/${SKILL_NAME}:${IMAGE_TAG}

build: check-env
	docker build -t ${DOCKER_IMAGE_URL} .

push: check-env
	cortex docker login
	docker push ${DOCKER_IMAGE_URL}

deploy: check-env
	cortex skills save -y skill.yaml --project ${PROJECT_NAME}
	sleep 10s # wait for action containers to pull and deploy

tests: check-env
	cortex skills invoke --params-file ./test/payload.json ${SKILL_NAME} request --project ${PROJECT_NAME}

all: build push deploy tests

get: check-env
	cortex skills describe ${SKILL_NAME} --project ${PROJECT_NAME}

check-env:
ifndef DOCKER_PREGISTRY_URL
	$(error environment variable DOCKER_PREGISTRY_URL is not set. Set it like <docker-registry-url>/<namespace-org>)
endif
ifndef PROJECT_NAME
	$(error environment variable PROJECT_NAME is not set. Set this to Cortex project name.)
endif
