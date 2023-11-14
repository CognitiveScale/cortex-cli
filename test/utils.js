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
function compatiblityResponse() {
    return { semver: '>=0.12.11' };
}
function compatibilityApi() {
    return '/fabric/v4/compatibility/applications/cortex-cli';
}
export { ansiRegex };
export { stripAnsi };
export { compatibilityApi };
export { compatiblityResponse };
export default {
    ansiRegex,
    stripAnsi,
    compatibilityApi,
    compatiblityResponse,
};
