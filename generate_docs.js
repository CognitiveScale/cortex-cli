/**
 * Opted to use pure JS versus adding handlebars as a dep, as handlebars always has vulns..
 */
const _ = require('lodash');
const fs = require('fs');

// read command args if passed
const sourcedir = _.get(process.argv,'[2]','.')
const outfile = _.get(process.argv,'[3]');

// use top level commands as driver
const rootJson = require(`${sourcedir}/cortex.json`)

// replace /n/t with HTML equivs
const cleanString = (s) => s
    .replace(/\n/g, '<br />')
    .replace(/\t/g, 'nbsp;nbsp;')
    .replace('<','`<')
    .replace('>','>`')

// print sub-command flags as string
const optionRow = (opts) => _.join(
    _.sortBy(opts,['flags']).map(
        (opt) => `\`${opt.flags}\`${ _.isEmpty(opt.defaultValue) ? '' : ` (*default:* \`${opt.defaultValue }\`)`} - ${cleanString(opt.description)}`
    ),
    '<br />'
)

const subcmdTable = (subcmd) => `| Command | Description | Options |
| ------- | ----------- | ------- |\n` +
_.join(
    _.sortBy(subcmd, ['name']).map((cmd) => `| \`${cmd.name} ${cmd.usage }\` | ${cmd.description } | ${optionRow(cmd.options)} |`),
    '\n'
)

const cmdHeading = (cmd) => `
## ${_.capitalize(cmd.name)}
\`\`\`
cortex ${cmd.name} ${cmd.usage}
\`\`\`    
${cmd.description}  
`;

const output = _.join(
    _.sortBy(rootJson, ["name"]).map(
        (cmd) =>`${cmdHeading(cmd)}\n`+
            `${subcmdTable(require(`${sourcedir}/cortex-${cmd.name}.json`))}`
        ),
'');

// if outfile write to file ...
if (_.isEmpty(outfile)) {
    console.log(output)
} else {
    fs.writeFileSync(outfile, output)
}