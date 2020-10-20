# Cortex CLI
A command line utility for the Cortex Platform.


[![Build Status](https://secure.travis-ci.org/CognitiveScale/cortex-cli.svg)](http://travis-ci.org/CognitiveScale/cortex-cli)

### Installation:

#### From NPM:
```bash
npm install -g cortex-cli
```

#### From Source:
Once you have the code pulled, run this command from the cortex-cli directory:
```bash
npm install -g .
```

**NOTE:** When we have a release of this module, it will be published to npm.org for distribution.

#### For Developers:
You can link your local copy of cortex-cli to your globally installed version:
```bash
npm link
```
Changes you make to the source code will now be available immediately (locally).

### Usage:

```bash
cortex <command> [sub-command] [options]
```
### Common Options

- -h, --help
- -v, --version

### Getting Started
```bash
cortex configure --file /personal/access/token.json --project defaultProject

or

cortex configure --project defaultProject
Cortex Personal Access Token: <paste access token>
```

Upon successful login, a config file will be saved in your home directory with your authentication token for future use. (**NOTE:** currently, you will have to re-run the configure command when your token expires).

To see a list of agents:
```bash
cortex agents list
[
  {
    "title": "Movie Recommendation Agent",
    "description": "Makes personalized movie recommendations for users.",
    "createdAt": "2017-12-22T03:07:39.863Z",
    "updatedAt": "2017-12-22T03:12:32.159Z",
    "name": "tutorial/movie_recommendation"
  },
  {
    "title": "Trading Insights Agent",
    "description": "Agent to generate personalized insights for traders.",
    "createdAt": "2017-12-22T03:07:40.109Z",
    "updatedAt": "2017-12-22T03:07:40.201Z",
    "name": "default/trading-insights-agent"
  },
  {
    "title": "Client Complaints Agent",
    "description": "Agent to intercept and classify customer complaints early in the process before it even goes to internal audit.",
    "createdAt": "2017-12-22T03:07:41.287Z",
    "updatedAt": "2017-12-22T03:07:41.360Z",
    "name": "default/client-complaints-agent"
  }
]
```

To use a different profile:
```bash
cortex configure --profile myprofile
...
cortex agents list --profile myprofile
```

#### Filtering Results using the --query option
Many of the commands support a __--query__ option for filtering JSON responses.  Queries use JMESPath to filter JSON documents. The specification for JMESPath can be found here: http://jmespath.org/.  It is similar to the popular JQ tool and supported by Amazon AWS and some other notable services.

For example, if I want to select just the name and title from my previous output:
```bash
cortex agents list --query "[].{name: name, title: title}"
[
  {
    "name": "tutorial/movie_recommendation",
    "title": "Movie Recommendation Agent"
  },
  {
    "name": "default/trading-insights-agent",
    "title": "Trading Insights Agent"
  },
  {
    "name": "default/client-complaints-agent",
    "title": "Client Complaints Agent"
  }
]
```

### Command List and Implementation Status:

- [x] configure
    - [x] list
- [ ] deploy
- [x] functions
    - [x] list
    - [X] describe [functionName]
    - [x] invoke [functionName]
    - [X] deploy [functionName]
    - [ ] delete [functionName]
- [ ] stacks
   - [ ] list
   - [ ] describe
   - [ ] deploy
   - [ ] delete
- [x] agents
    - [x] list
    - [x] save [agentDefinition]
    - [x] describe [agentName]
    - [ ] delete [agentName]
    - [x] get-snapshots [agentName]
    - [x] create-snapshots [snapshotDefinition]
    - [x] invoke [serviceName]
    - [x] get-service-activation [activationId]
- [x] types
    - [x] list
    - [x] save [typeDefinition]
    - [x] describe [typeName]
    - [ ] delete [typeName]
- [x] skills
    - [x] list
    - [x] save [skillDefinition]
    - [x] describe [skillName]
    - [ ] delete [skillName]
    - [x] generate
- [x] content
    - [x] upload
    - [x] download
    - [x] delete
    - [x] list
- [ ] jobs
    - [x] list
    - [x] save
    - [x] describe
    - [x] status
    - [ ] delete
- [x] tasks
    - [x] list
    - [x] logs
    - [x] cancel
    - [x] describe
- [ ] connections
    - [x] list
    - [x] list-types
    - [x] save [connectionDefinition]
    - [ ] delete [connectionName]
    - [x] describe [connectionName]
    - [x] test [connectionName]
    - [x] generate
- [ ] datasets
    - [x] list
    - [x] save [datasetDefinition]
    - [ ] delete [datasetName]
    - [x] describe [datasetName]
    - [x] get-dataframe [datasetName]
    - [x] get-stream [datasetName]
    - [x] generate
- [ ] snapshots
- [ ] environments
   - [ ] list
   - [ ] save [environmentDefinition]
   - [ ] delete [environmentDefinition]
   - [ ] describe [environmentName]
- [ ] container-registries
    - [ ] list
    - [ ] save [registryName]
    - [ ] delete [registryName]
- [x] profiles
    - [x] save-schema
    - [x] list-schemas
    - [x] describe-schema
    - [x] delete-schema
    - [x] list
    - [x] list-versions
    - [x] describe
    - [x] delete
    - [x] rebuild
- [x] graph
    - [x] find-events
    - [x] publish
- [x] experiments
    - [x] list
    - [x] describe
    - [x] delete
    - [x] list-runs
    - [x] describe-runs
    - [x] delete-run
    - [x] download-artifact
