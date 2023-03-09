/**
 * Opted to use pure JS versus adding handlebars as a dep, as handlebars always has vulns..
 */
import process from 'node:process';
import _ from 'lodash';
import esMain from 'es-main';

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

export default function markdownForCmd(program) {
    const docObj = docObject(program);
    return `${cmdHeading(program)}\n${subcmdTable(docObj)}`;
}

if (esMain(import.meta)) {
    const { default: program } = await import(process.argv[2]);
    console.log(markdownForCmd(program));
}

// eslint-disable-next-line import/no-dynamic-require
