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

## Standalone binary

We use [pkg](https://www.npmjs.com/package/pkg) to bundle the Cortex cli's source, dependencies, and node runtime into a standalone executable

Executables are created for the following platforms:
  - Linux 64bit intel
  - Windows 64bit intel
  - macOS 64 bit intel. 
  - macOS 64 bit M1/M2.

__NOTE:__ Apple M1/M2 (arm64 binary) is experimental

### Signed binaries status
* windows: binaries are currently **unsigned**
* macOS: adhoc signature using [ldid](https://github.com/xerub/ldid)

**Known Issues**
cortex workspaces - is non functional on Window and macOs until we can provide pre-compiled binaries for the following dependencies: ssh2, keytar, cpufeatures
