import { ENV_VAR_REGEX } from './regex.js'
import extractEnvironmentVariableValueFromLine from './extract-environment-variable-value-from-line.js'

const extractKeyValueFromString = (str: string) => {
	const match = str.match(ENV_VAR_REGEX)

	if (!match) {
		return null
	}

	return {
		key: match[1],
		value: extractEnvironmentVariableValueFromLine(match[2]),
	}
}

export default extractKeyValueFromString
