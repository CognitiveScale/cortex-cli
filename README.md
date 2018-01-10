# Cortex CLI

### Usage:

```bash
cortex <command> [sub-command] [options]
```
### Common Options

- -h, --help
- -V, --version

### Commands:

- configure
    - list
- deploy
- agents
    - list
    - save [agentDefinition]
    - describe [agentName]
    - delete [agentName]
    - invoke [serviceName]
    - get-service-activation [activationId]
- types
    - list
    - save [typeDefinition]
    - describe [typeName]
    - delete [typeName]
- skills
    - list
    - save [skillDefinition]
    - describe [skillName]
    - delete [skillName]
- processors
    - save-runtime [runtimeDefinition]
    - list-runtimes
    - describe-runtime [runtimeName]
    - delete-runtime [runtimeName]
    - invoke-action [runtimeName] [actionId]
    - list-actions [runtimeName]
- content
    - upload
    - download
    - describe
- jobs
- connections
    - list
    - save [connectionDefinition]
    - delete [connectionName]
    - describe [connectionName]
    - test [connectionName]
- datasets
    - list
    - save [datasetDefinition]
    - delete [datasetName]
    - describe [datasetName]
    - get-dataframe [datasetName]
    - get-stream [datasetName]
- snapshots
- instances