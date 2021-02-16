### External API Skill type

This skill type allows users to wrap an external REST API as a Cortex Fabric Skill.

1. Update `skill.yaml` with `HTTP Method`, `URL`, `Path` and `headers` per the targeted external API
2. Deploy the Skill `cortex skills save -y skill.yaml --project <Project Name>`

The Skill is added to the Cortex Fabric catalog and is available for selection when building interventions or Agents.

Skills that are deployed may be invoked (run) either independently or within an agent.

For more details about how to build skills go to [Cortex Fabric Documentation - Development - Develop Skills](https://cognitivescale.github.io/cortex-fabric/docs/development/define-skills)
