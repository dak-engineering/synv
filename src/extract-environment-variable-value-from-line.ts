const extractEnvironmentVariableValueFromLine = (value: string) => {
	let result = ''
	let insideQuotes = false
	let quoteChar = ''

	for (let charPosition = 0; charPosition < value.length; charPosition++) {
		const char = value[charPosition]
		const isQuote = char === '"' || char === '\''
		const isEscaped = charPosition > 0 && value[charPosition - 1] === '\\'

		if (isQuote && !isEscaped) {
			if (!insideQuotes) {
				insideQuotes = true
				quoteChar = char
			} else if (char === quoteChar) {
				insideQuotes = false
				quoteChar = ''
			}
		}

		if (char === '#' && !insideQuotes) {
			break
		}

		result += char
	}

	result = result.trim()
	const isQuoted = (result.startsWith('\'') && result.endsWith('\'')) ||
		(result.startsWith('"') && result.endsWith('"'))

	if (isQuoted) {
		result = result.slice(1, -1)
	}

	return result
}

export default extractEnvironmentVariableValueFromLine
