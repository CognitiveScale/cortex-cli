#!/bin/bash -eu
OUTFILE=cortex-cli-docs.md

header() {
cat << 'EOF'
---
title: "Cortex CLI"
linkTitle: "Cortex CLI"
description: >
  Provides a list of all commands available in the Cortex Command Line Interface.
---
This reference guide provides a list of all commands available in the Cortex Command Line
Interface (Cortex CLI). See [CLI](getting-started/use-cli.md) for
help getting started using the CLI.
## Notation
The following table describes the common notation used in this reference guide.

| Notation | Description  | Example                                       |
| -------- | -----------  | -------                                       |
| `\< \>`    | Required     | `<value>` denotes a required value.      |
| `[ ]`    | Optional     | `[options]` denotes an optional value.        |
## Syntax
```cli
cortex [command] [options]
```
## Global options
| Option | Description |
| --------- | --------- |
| `-v`, `--version` | Outputs the version number. |
| `-h`, `--help` | Outputs usage information. |
| `--profile [profile]` | Run the CLI using the specified profile instead of the default config. |
## General notes
* The output results for most `list` commands display as a table. Add the
`--json` option to output results as JSON. When `--json` is used, you can use the
`--query` option to [filter the results](/getting-started/use-cli.md).
* The output results for `describe` commands display in the format of the document
it is describing. This can include YAML, JSON, or other formats.
EOF
}
# generating markdown
#node generate_docs.js ${OUTFILE}
#echo
#echo "Done -> ${OUTFILE}"
echo "$(header)" > ${OUTFILE}
for CMD in $(ls -1 ./bin/cortex-*.js | sort); do
  echo $CMD
  node generate_docs.js $CMD >> $OUTFILE
done
