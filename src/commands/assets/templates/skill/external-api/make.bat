@echo off

for /f %%q in ("%~dp0.") do SET SKILL_NAME=%%~nxq

SET IMAGE_TAG=latest
SET DOCKER_IMAGE_URL=%DOCKER_PREGISTRY_URL%/%SKILL_NAME%:%IMAGE_TAG%

GOTO :checkenv %*

:deploy
	echo Deploying %SKILL_NAME% ...
    cmd /c cortex skills save -y skill.yaml --project %PROJECT_NAME%
	GOTO :get

:tests
	echo Testing %SKILL_NAME%
    cmd /c cortex skills invoke --params-file ./test/payload.json %SKILL_NAME% input --project %PROJECT_NAME%
	GOTO :EOF

:get
    cmd /c cortex skills describe %SKILL_NAME%  --verbose --project %PROJECT_NAME%
	GOTO :EOF

:checkenv
	echo Validating environment variables
	IF "!PROJECT_NAME!" == ""  (
		echo  "Environment variable PROJECT_NAME is not set. Set this to Cortex project name."
		exit/b 1
	)
	GOTO :%1
