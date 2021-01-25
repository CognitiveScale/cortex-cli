### External API Skill

This Cortex skill is to wrap an external REST API as a skill

1. Update `skill.yaml` with `HTTP Method`, `URL`, `Path` and `headers` per the targeted external API
2. Deploy either Skill `cortex skills save -y skill.yaml --project <Project Name>`

The Skill is added to the Cortex Fabric catalog and is available for selection when building interventions or Agents.

Skills that are deployed may be invoked (run) either independently or within an agent.

For more details about how to build skills go to [Cortex Fabric Documentation - Build Skills - Define Skills](https://cognitivescale.github.io/cortex-fabric/docs/build-skills/define-skills)
