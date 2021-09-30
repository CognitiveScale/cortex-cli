// COPIED from https://github.com/chalk/ansi-regex  ( esm not cjs :( )
function ansiRegex({ onlyFirst = false } = {}) {
    const pattern = [
        '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
        '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
    ].join('|');
    return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

function stripAnsi(s) {
    return s.replace(ansiRegex(), '');
}
module.exports = { ansiRegex, stripAnsi };