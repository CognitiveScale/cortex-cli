### Daemon Skill

Background job running Cortex skill

#### Files generated:
* `skill.yaml` Skill definition
* `__main__.py` Python3 code implementing job's business logic
* `requirements.txt` Python3 libraries dependencies
* `Dockerfile` to build Docker image for this skill

#### Next Steps:
* Add input/output parameters and properties in skill.yaml as per requirement 
* Update `__main__.py` with the business logic this skill will implement.
* Add required libraries to `requirements.txt` 
* Make changes to Dockerfile if required 

#### Deployment Steps
* Build the docker image and push to registry accessible to Cortex DCI
    ```bash
        docker build -t <SKILL_NAME>:<DOCKER_IMAGE_TAG>  -f Dockerfile .
        docker tag <SKILL_NAME>:<DOCKER_IMAGE_TAG> <DOCKER_IMAGE_URL_IN_REGISTRY>
        docker push <DOCKER_IMAGE_URL_IN_REGISTRY>
    ```
* Save Cortex Action `cortex actions deploy <SKILL_NAME> --actionType job --docker <DOCKER_IMAGE> --cmd '["python", "/app/__main__.py"]'  --project <Project Name>`
* Deploy this Skill `cortex skills save -y skill.yaml --project <Project Name>`
