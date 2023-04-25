import _ from 'lodash';
import { program } from 'commander';

function nonEmptyStringParser(opts) {
    const { message = 'empty string argument', variadic = false } = opts;
    return function parseNonEmptyString(value, oldValue) {
        if (_.isEmpty(value)) {
            const error = `error: ${message}`;
            console.error(error);
            program._exit(1, 'cortex.invalidStringArgument', error);
        }
        if (variadic) {
            if (!Array.isArray(oldValue)) {
                return [value];
            }
            return oldValue.concat(value);
        }
        return value;
    };
}
// append relevant prefix to keys
function transformDynamicParams(params, prefix) {
    const jsonParams = JSON.parse(params);
    Object.keys(jsonParams)
        .forEach((key) => {
        if (!_.startsWith(prefix, key)) {
            jsonParams[`${prefix}${key}`] = jsonParams[key];
            delete jsonParams[key];
        }
    });
    return JSON.stringify(jsonParams);
}
export { nonEmptyStringParser };
export { transformDynamicParams };
export default {
    nonEmptyStringParser,
    transformDynamicParams,
};
