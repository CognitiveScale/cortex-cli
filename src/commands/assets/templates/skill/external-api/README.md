### External API Skill type

This skill type allows users to wrap an external REST API as a Cortex Fabric Skill.

#### Prerequisites
* `cortex-cli`

1. Update `skill.yaml` with `HTTP Method`, `URL`, `Path` and `headers` per the targeted external API
2. Deploy the Skill `cortex skills save -y skill.yaml --project <Project Name>`

#### Steps to deploy

Set environment variable `PROJECT_NAME` (Cortex Project Name), and use build scripts to build and deploy.

##### On *nix systems
A Makefile is provided to do these steps.
* `export PROJECT_NAME=<cortex-project>`
* `make all` will deploy the Skill, and then invoke the Skill to test.

##### On Windows systems
A `make.bat` batch file is provided to do these steps.
* `set PROJECT_NAME=<cortex-project>`
  > Below commands will build and push Docker image, deploy Cortex Action and Skill, and then invoke Skill to test.
* `make deploy`
* `make tests`

The Skill is added to the Cortex Fabric catalog and is available for selection when building interventions or Agents.

Skills that are deployed may be invoked (run) either independently or within an agent.

For more details about how to build skills go to [Cortex Fabric Documentation - Development - Develop Skills](https://cognitivescale.github.io/cortex-fabric/docs/development/define-skills)
