### Job Skill type

Cortex skill that runs a background job.

#### Files generated
* `test/`
    * `payload.json` Payload used when invoking Skill
* `Dockerfile` Builds the Docker image for the Action
* `main.py` Code for Cortex job
* `Makefile` Used to perform deployment steps
* `README.md` Provides the objectives, requirements, and instructions for generating and deploying the Skill.
* `requirements.txt` Dependencies and libraries
* `skill.yaml` Skill definition and Action mapping


#### Steps

1. Modify the main executable (`main.py` by default) run by the action image's entrypoint/command to handle the action's custom logic.
2. Modify the `requirements.txt` file to provide packages or libraries that the action requires.
3. Modify the `skill.yaml` file as needed. The Skill is added to the Cortex Fabric catalog and is available for selection when building interventions or Agents. Skills that are deployed may be invoked (run) either independently or within an agent. For more details about how to build Skills go to [Cortex Fabric Documentation - Development - Develop Skills](https://cognitivescale.github.io/cortex-fabric/docs/build-skills/define-skills)
4. A Makefile is provided to do these steps. Set environment variables `DOCKER_PREGISTRY_URL` (like `<docker-registry-url>/<namespace-org>`) and `PROJECT_NAME` (Cortex Project Name) to use the Makefile.
   `make all` will build and push Docker image, deploy Cortex Skill, and then invoke Skill to test.
   ```text
   DOCKER_PREGISTRY_URL=<docker-registry-url>/<namespace-org> PROJECT_NAME=<project-name> make all
   ```

#### Test the code locally
To avoid using up your private registry space, it is good practice testing your code before pushing.

Create Python virtual env.
```shell
python -m venv testvenv
source testvenv/bin/activate
pip install -r requirements.txt
```

Testing the job.
```shell
python ./main.py '{"payload":{"message":  "This is a test payload message"}}'
````
Response:
```text
{"message":  "This is a test payload message"}
```
