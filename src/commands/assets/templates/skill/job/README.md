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

A Makefile is provided to do these steps. Set environment variables `DOCKER_PREGISTRY_URL` (like <docker-registry-url>/<namespace-org>) and `PROJECT_NAME` (Cortex Project Name) and use Makefile to deploy Skill.
`make all` will build and push Docker image, deploy Cortex Skill, and then invoke Skill to test.

1. Modify the main executable (`main.py` by default) run by the action image's entrypoint/command to handle the action's custom logic.
2. Modify the `requirements.txt` file to provide packages or libraries that the action requires.
3. Build the docker image (uses the `main.py` file)
  ```
  docker build -t <image-name>:<version> .
  ```
4. Push the docker image to a registry that is connected to your Kubernetes cluster.
  ```
  docker push <image-name>:<version>
  ```

**(Optionally) Retag an image**
  ```
  docker tag <existing-image-name>:<existing-version> <new-image-name>:<new-version>
  ```
5. Modify the `skill.yaml` file.
6. Save/deploy the Skill.
  ```
  cortex skills save -y skill.yaml --project <Project Name>
  ```

The Skill is added to the Cortex Fabric catalog and is available for selection when building interventions or Agents.

Skills that are deployed may be invoked (run) either independently or within an agent.

For more details about how to build Skills go to [Cortex Fabric Documentation - Development - Develop Skills](https://cognitivescale.github.io/cortex-fabric/docs/build-skills/define-skills)
