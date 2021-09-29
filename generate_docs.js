/**
 * Opted to use pure JS versus adding handlebars as a dep, as handlebars always has vulns..
 */
const _ = require('lodash');
const fs = require('fs');
const glob = require('glob');

const outfile = _.get(process.argv, '[2]');

const cmd_files = ['./bin/cortex-agents.js', './bin/cortex-actions.js']; // glob.sync('./bin/cortex-*.js');

function docObject(program) {
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


function markdownForCmd(program) {
    const docObj = docObject(program);
    return `${cmdHeading(program)}\n${subcmdTable(docObj)}`;
}

const cmd = require(process.argv[2]);
console.log(markdownForCmd(cmd));
