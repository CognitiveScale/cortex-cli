SKILL_NAME=$(notdir $(CURDIR))

deploy: check-env
	cortex skills save -y skill.yaml --project ${PROJECT_NAME}

tests: check-env
	cortex skills invoke --params-file ./test/payload.json ${SKILL_NAME} input --project ${PROJECT_NAME}

all: deploy tests

get: check-env
	cortex skills describe ${SKILL_NAME} --project ${PROJECT_NAME}

check-env:
ifndef PROJECT_NAME
	$(error environment variable PROJECT_NAME is not set. Set this to Cortex project name.)
endif
