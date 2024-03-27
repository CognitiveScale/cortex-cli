# Workspaces

## Overview

Note that `workspaces` CLI commands are narrowly focused on generating Skill templates. Ideally `workspaces` would encompass Pipeline as well, but the initial implementation for Pipelines uses its CLI commands (similar to `workspaces`).

Both commands only support Git Repositories hosted on GitHub!

### Templates

The primary repository with templates can be found at: <https://github.com/CognitiveScale/cortex-code-templates>

* A template is any folder within the git Repository that contains a `metadata.json` file.

    Expected structure for `metadata.json`:

    ```json
    {
        "name": "<template-name>",
        "title": "<template-title>",
        "description": "<template-description>",
        "tags": ["list", "of", "tags", "applied", "to", "template"],
        "enabled": true,
        "resourceType": "Skill" // e.g. "Pipeline"
    }
    ```

* Templates can be nested in any subfolder in the repository
* The templating process works via the [loadsh template](https://docs-lodash.com/v4/template/) util. Refer to that documentation for how variables are templated.

### Additional Reference

* [Example Cortex Development Workflow](https://drive.google.com/file/d/1tPyuqtNFz9JFtJuQE6HRxou_SLKIK8fO/view?usp=drive_link)
* [Relation to Skill Building](https://docs.google.com/presentation/d/1k4vJ7d5oGbvFaUezl5dBXHtKc-CZK8IAGlvIq-RpJrk/edit#slide=id.g12c69d77b32_0_42) (i.e. migration from traditional Skill Building)

## Workspaces Configure

The configuration process implements the [Github OAuth Device Flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow). The reason for implementing this flow is primarily to avoid rate limiting issues from the GitHub rest API, see:

* [Unauthenticated User Rate Limiting](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-unauthenticated-users) (~60 requests per hour)
* [Authenticated User Rate Limiting](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-authenticated-users) (~5000 requests per hour)

The GitHub authentication does NOT allow users to access private repositories. Using a private repository would require [registering the Cortex CLI App in your developer settings](https://github.com/orgs/community/discussions/48102).

```mermaid
%% Title: Cortex Workspaces configure CLI command
sequenceDiagram
    autonumber
    title Workspaces Configure CLI subcommand 
    Actor D as Dev
    participant C as Cortex CLI
    participant F as Filesystem

    %% Mac: KeyChain
    %% Linux: Secret Service API/libsecret
    %% Windows: Credential Vault
    participant K as System Keychain<br>(Optional)

    participant B as Browser
    participant G as GitHub

    D->>+C: Configure CLI
    Note over D,C: cortex workspaces configure --refresh --no-timeout

    C->>+F: Read Config File<br>fetch existing config
    C->>+D: Prompt user for Repository/Branch
    C->>+D: User responds with answers

    %% TODO: Check if token is valid
    %% If it's invalid and not being refreshed - exit with error

    C->>+B: Browser Opens at GitHub
    D->>+B: Enter code & authorize Cortex CLI
    loop Fixed Interval (e.g. 5 seconds)
        C->>+G: Fetch GitHub Device Code
        G->>+C: JSON (Potential Device Code)
        Note over C,G: HHTP POST https://github.com/login/device/code

        critical Check Access Token
        option Access Token returned
            alt Keychain service available
                C->>+K: Store token in Keychain
            else Local File fallback
                C->>+F: Store token as file in Config folder
            end
            C->>+D: Configuration Successful
        option Authorization Pending
            C->>+C: Update Expiration Time
        option Slow Down
            C->>+C: Increment Poll Interval
        option Expired Token
            C->>+D: Exit with error - re-configure and try again
        option Incorrect Device Code
            C->>+D: Exit with error - incorrect device code entered
        option Access Denied
            C->>+D: Exit with error - Access denied by user
        option Unexpected Error
            C->>+D: Exit with error
        end
    end
```

<!--
TODO's:
- Work on pipeline template
- Export data for Pipeline template to local CSV
- Add example README
- Test that workspaces generate command still works
-->

## Workspaces Generate

The following diagram shows the sequence of steps taken when generating a template.

```mermaid
sequenceDiagram
    autonumber
    title Workspaces Generate CLI subcommand 
    Actor D as Dev
    participant C as Cortex CLI
    participant F as Filesystem

    %% Mac: KeyChain
    %% Linux: Secret Service API/libsecret
    %% Windows: Credential Vault
    participant K as System Keychain<br>(Optional)
    participant G as GitHub

    D->>+C: Generate Pipeline
    Note over D,C: cortex workspaces generate <name> <destination>

    critical Github Token Validation
        C->>+F: Read the user config File
        alt Keychain service available
            C->>+K: Load token from Keychain
        else Local File fallback
            C->>+F: Load token from cached file in Config folder
        end
        %% Valdiate the Token 
        C->>+G: Validate Token with Github API
        Note over C,G: HTTP GET https://api.github.com/user (with Token)

        option Token is Invalid
            C->>+C: Force user to configure template repository (recreate Token)
        option Token is Valid
            C->>+C: Continue (No-Op)
    end

    opt Fail early if destination already exists
        C->>+F: Check if the destination exists
        C->>+D: Report Error to user
    end

    critical Fetch Git Tree for the Repository/Branch
        C->>+G: Fetch the HEAD of the configured repository/branch
        G->>+C: git SHA (JSON)
        Note over C,G: HTTP GET https://api.github.com/repos/<repo>/branches/<branch>
        alt Repository & Branch exist
            C->>+G: Fetch Git Tree(s) from the Repo
            G->>+C: Git Tree (JSON)/fetch
            Note over C,G: HTTP GET https://api.github.com/repos/<repo>/git/trees/<sha>?recursive=true
        end
    end

    critical Select Template
        Note right of C: Templates are identifed based<br>on presence of `metadata.json`
        C->>+C: Use glob to find potential templates in Git Tree
        loop For each potential template
            C->>+G: Read the metadata.json file for the Template
            G->>+C: JSON
            Note over C,G: HTTP GET https://api.github.com/repos/<repo>/contents/<filePath>?ref=<branch>
        end
        
        C->>+D: Prompt User for template selection
        D->>+C: Answers (Template Choice, Template Name, etc.)
        alt No Templates found
            C->>+D: Display Error
        end
        alt Selected Template does not exist
            C->>+D: Display Error
        end
    end

    critical Generate Template
        C->>+C: Use glob to identify files corresponding to template in Git Tree

        opt Fail early if destination already exists
            C->>+F: Check if the destination exists
            C->>+D: Report Error to user
        end

        C->>+C: Compute generated files<br>with templated values
        loop For each templated file
            C->>+G: Fetch file contents
            G->>+C: File Contents (stream)
            Note over C,G: HTTP GET https://api.github.com/repos/<repo>/contents/<filePath>?ref=<branch>
            C->>+C: Apply templating
            C->>+F: Write templated file to Filesystem
        end
    end

    opt Display generated file tree to user
        C->>+D: Print the generated file tree 
    end
```

## Relation to Pipelines

The Cortex CLI offers similar capabilities for generating Pipelines template, similar to Workspaces, however, the both are distinct features (subcommands) in the CLI.

### Pipelines Configure

The process is simlilar to that of [workspaces configure](#workspaces-configure), but:

* A separate section of the Config file is used to store the Repository configuration - i.e. The Pipeline Template repository can be different

```bash
$ cortex pipelines configure --refresh --no-timeout
Configuring workspaces for profile qa-aks
? Template Repository URL:    CognitiveScale/cortex-code-templates
? Template Repository Branch: FAB-6046-pipeline-generate
Opening browser at https://github.com/login/device
Please enter the following code to authorize the Cortex CLI: FB05-0378   ( Expires in 14 minutes and 58 seconds ) - CTRL-C to abort
Github token configuration successful.
```

### Pipelines Generate

The process is simlilar to that of [workspaces generate](#workspaces-generate), but only Pipeline templates are available.

```bash
$ cortex pipelines generate
```

## Workspaces vs Pipelines

The Cortex CLI offers similar capabilities for generating Pipelines template, similar to Workspaces, however, the both are distinct features (subcommands) in the CLI.
