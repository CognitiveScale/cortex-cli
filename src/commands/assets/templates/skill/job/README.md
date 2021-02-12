### Job Skill type

Cortex skill that runs a background job.

#### Files generated

- `skill.yaml` Skill definition
- `main.py` Python3 code implementing job's business logic
- `requirements.txt` Python3 libraries dependencies
- `Dockerfile` to build Docker image for this skill

#### Steps

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

5. Deploy the action.

```
cortex actions deploy --actionName <SKILL_NAME> \
--actionType job \
--docker <DOCKER_IMAGE> \
--project <Project Name>
```

6. Modify the `skill.yaml` file.
7. Save/deploy the Skill.

```
cortex skills save -y skill.yaml --project <Project Name>
```

The Skill is added to the Cortex Fabric catalog and is available for selection when building interventions or Agents.

Skills that are deployed may be invoked (run) either independently or within an agent.

For more details about how to build skills go to [Cortex Fabric Documentation - Build Skills - Define Skills](https://cognitivescale.github.io/cortex-fabric/docs/build-skills/define-skills)
