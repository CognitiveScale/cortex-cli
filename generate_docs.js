/**
 * Opted to use pure JS versus adding handlebars as a dep, as handlebars always has vulns..
 */
const _ = require('lodash');
const fs = require('fs');
const glob = require('glob');

const outfile = _.get(process.argv, '[2]');

const cmd_files = ['./bin/cortex-agents.js', './bin/cortex-agents.js']; // glob.sync('./bin/cortex-*.js');

function genDocs(program) {
    return program.commands.map((c) => ({
        name: c._name,
        description: c._description,
        usage: c.usage(),
        options: c.options.map((o) => ({
            flags: o.flags,
            defaultValue: o.defaultValue,
            description: o.description,
        })),
    }));
}

// replace /n/t with HTML equivs
const cleanString = (s) => s
    .replace(/\n/g, '')
    .replace(/\t/g, '')
    .replace(/</g, '`<')
    .replace(/>/g, '>`');

// print sub-command flags as string
const optionRow = (opts) => _.join(
    _.sortBy(opts, ['flags']).map(
        (opt) => `\`${opt.flags}\`${_.isEmpty(opt.defaultValue) ? '' : ` (*default:* \`${opt.defaultValue}\`)`} - ${cleanString(opt.description)}`,
    ),
    '<br />',
);

const subcmdTable = (subcmd) => `| Command | Description | Options |
| ------- | ----------- | ------- |\n${ 
_.join(
    _.sortBy(subcmd, ['name']).map((cmd) => `| \`${cmd.name} ${cmd.usage}\` | ${cmd.description} | ${optionRow(cmd.options)} |`),
    '\n',
)}`;

const cmdHeading = (cmd) => `
## ${_.capitalize(cmd.name())}
\`\`\`
${cmd.name()} ${cmd.usage()}
\`\`\`    
${cmd.description()}  
`;

const header = `---
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
| \`< >\`    | Required     | \`<value>\` denotes a required value.      |
| \`[ ]\`    | Optional     | \`[options]\` denotes an optional value.        |
## Syntax
\`\`\`cli
cortex [command] [options]
\`\`\`
## Global options
| Option | Description |
| --------- | --------- |
| \`-v\`, \`--version\` | Outputs the version number. |
| \`-h\`, \`--help\` | Outputs usage information. |
| \`--profile [profile]\` | Run the CLI using the specified profile instead of the default config. |
## General notes
* The output results for most \`list\` commands display as a table. Add the
\`--json\` option to output results as JSON. When \`--json\` is used, you can use the
\`--query\` option to [filter the results](/getting-started/use-cli.md).
* The output results for \`describe\` commands display in the format of the document
it is describing. This can include YAML, JSON, or other formats.
`;

const body = cmd_files.sort().map((cmdFile) => {
    // eslint-disable-next-line import/no-dynamic-require
    const cacheName = require.resolve(cmdFile);
    const prog = require(cmdFile);
    const docObj = genDocs(prog);
    const res = `${cmdHeading(prog)}\n${subcmdTable(docObj)}`;
    delete require.cache(cacheName);
    return res;
});

const output = header + body;
// if outfile write to file ...
if (_.isEmpty(outfile)) {
    console.log(output);
} else {
    fs.writeFileSync(outfile, output);
}
