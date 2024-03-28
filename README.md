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

The cortex cli can be run directly from the source with a simple wrapper script
```
git clone https://github.com/CognitiveScale/cortex-cli.git
cat > /usr/local/bin/cortex <<EOM
#!/bin/bash
$PWD/cortex-cli/bin/cortex.js "\$@"
EOM
chmod +x /usr/local/bin/cortex
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

#### Filtering Results using the --json or --query option (DEPRECATION WARNING for --query)
Many of the commands support a __--json / --query__ option for filtering JSON responses.  Queries use JMESPath to filter JSON documents. The specification for JMESPath can be found here: http://jmespath.org/.  It is similar to the popular JQ tool and supported by Amazon AWS and some other notable services.

For example, if I want to select just the name and title from my previous output:
```bash
cortex agents list --json "[].{name: name, title: title}"
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

## Standalone binary

We use caxa https://github.com/leafac/caxa to build standalone binaries.
Previously, we used `pkg` but it doesn't support ESM without transpilation as of 07/2023

Executables are created for the following platforms:
  - Linux 64bit intel
  - Windows 64bit intel
  - macOS 64 bit intel. 
  - macOS 64 bit M1/M2.

### Signed binaries status
* windows: binaries are currently **unsigned**
* macOS: adhoc signature using [ldid](https://github.com/xerub/ldid)

## Subcommands & Compatibility Checks

The following sequence diagram shows an example running a command with  Cortex CLI - namely which HTTP requests. ([This diagram can be viewered here](https://mermaid.live/view#pako:eNp9VE1z2jAQ_Ss7nh6aAeJLT54OHcZAQ4c4TEx64iLLa6IiS6ok0zCZ_PdKlg0k0Ookad--_XgrvUZUlhglkcHfDQqKU0a2mtQbAW6RxkrR1AXqcJ5QKzVMcR-OhXyBdLmAVNY1EaUJt34poi2jTBFhIQVigEpt8eU6IG-KEwQUU8iZwI4NRRk25x5zxtEcjMX60pZ7rhyFITBZLS7tmbdnq_tgcbWMxuNBmlyEB86M3YgAo5o5AsJhKUkJKy0rl0Ewpd7_lFACj7PJFD7dPdzP4ttAGlMpKrYN-BO0C5zyxp00PD0uh576F1I7BLT0to_ehsgTuFuvV_B9toa4IoVmNN5_iZmoZEDlHd-P_CGDzznqvSNdsxoht6RWQ5gjsY1GmHOyNTc99ah1WrKatUrQTksoiMESpICqc6u825ko3YhwCwtz5um2Svmyy28nuX0FDpJAiRy3xCJYCebo07Fyg-9dBk6eBGZaS53Ak9gJ-Uf003aRSSYdrfRFu0jDzAnRtGBFLCsYZ_YA6TPS3YWmVzFtR5vC53298fTcKyZKcUdmmRQmDqqPKGdnyrTlB20e3Vtj2nX3J2rjPG76lELAQXYWsWti9oFisieMk4Jj-wA7nl7UfzYlD01xz9ihL2fbDTys3j-__7ZAhWE18dduN4775zPSqKRh7rtgR6oPJRwjnbKOhlGNuiasdD_Sq7_eRPYZa9xEiduWRO820Ua8OZz_mvKDoFFidYPDqFGlG6vu9wqXb38B-i2SbA)).

The Cortex CLI will limit the set of available subcommands, to those which are supported by the Cortex cluster that it is
communicating with.

```mermaid
sequenceDiagram
    autonumber
    Actor Dev
    box CLI Commands
        participant C as cortex
        participant Sub as cortex pipelines
    end
    participant Filesystem
    participant S as Sensa API
    participant N as NPM
    Dev->>+C: cortex pipelines list

    critical Load Profile
    C->>+Filesystem: READ $HOME/.cortex/config
    Filesystem->>+C: Cluster URL, Project, etc.

    C->>+S: HTTP GET /fabric/v4/info
    S->>+C: JSON (Server Time Stamp, Feature Flags)
    C-->+C: Limit Subcommands based on feature flags
    end

    alt Is Subcommand Supported?
        C->>Sub: delegate to subcommand
    else
        C->>+Dev: Error: Unknown Command
    end

    Note over Sub,N: Run Compatibility Check

    critical Compatibility Check
    Sub->>S: HTTP GET /fabric/v4/compatibility/applications/cortex-cli
    S->>+Sub: JSON (Required Version)

    Sub->>+N: HTTP GET <npm-registry-url>
    N->>+Sub: JSON (Available CLI Versions)
    end

    Note over Sub,S: Run Action

    critical List Pipelines
    Sub->>S: HTTP GET /fabric/v4/projects/<project>/pipeline-repositories
    S->>+Sub: JSON (Pipelines)
    end
```

Practical Notes:
* Only want to load the Profile & perform a Compatibility Check once during command execution
* Clear downside is that startup for initial help commands are slightly slower due to the dynamic nature of loading
    subcommands

### Preview Features

All preview features cam be enabled in the CLI by setting the `PREVIEW_FEATURES_ENABLED` environment variable.

    Example
    ```
    PREVIEW_FEATURES_ENABLED=* cortex -h
    ```
