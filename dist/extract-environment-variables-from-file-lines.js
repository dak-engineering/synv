import extractEnvironmentVariableValueFromLine from './extract-environment-variable-value-from-line';
import { ENV_VAR_REGEX } from './regex';
const extractEnvironmentVariablesFromFileLines = (lines) => {
    const environmentVariables = {};
    for (const line of lines) {
        const match = line.match(ENV_VAR_REGEX);
        if (match) {
            environmentVariables[match[1]] = extractEnvironmentVariableValueFromLine(match[2]);
        }
    }
    return environmentVariables;
};
export default extractEnvironmentVariablesFromFileLines;
