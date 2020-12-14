### Daemon Skill

Long running Cortex skill serving REST API requests

#### Files generated:
* `skill.yaml` Skill definition
* `main.py` Python3 code serving the daemon API
* `requirements.txt` Python3 libraries dependencies
* `Dockerfile` to build Docker image for this skill

#### Next Steps:
* Add input/output parameters and properties in skill.yaml as per requirement 
* Update `main.py` with the business logic this skill will implement.
* Add required libraries to `requirements.txt` 
* Make changes to Dockerfile if required 

Note:
> This is a Fast API/Uvicorn based Python3 project, feel free to change to other framework or language as per the need

#### Deployment Steps
* Build the docker image and push to registry accessible to Cortex DCI
    ```bash
        docker build -t <SKILL_NAME>:<DOCKER_IMAGE_TAG>  -f Dockerfile .
        docker tag <SKILL_NAME>:<DOCKER_IMAGE_TAG> <DOCKER_IMAGE_URL_IN_REGISTRY>
        docker push <DOCKER_IMAGE_URL_IN_REGISTRY>
    ```
* Save Cortex Action `cortex actions deploy <SKILL_NAME> --actionType daemon --docker <DOCKER_IMAGE> --port '5000'  --project <Project Name>`
* Deploy this Skill `cortex skills save -y skill.yaml --project <Project Name>`
