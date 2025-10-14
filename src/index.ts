import { existsSync, readFileSync, writeFileSync } from 'fs'
import { input, select } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'

interface ParsedEnv {
	entries: Array<{ key: string; value: string; comment?: string }>
	raw: string
}

interface SyncOptions {
	envExampleFile?: string
	envFile?: string
	interactive?: boolean
}

function parseEnvFile(content: string): ParsedEnv {
	const lines = content.split('\n')
	const entries: Array<{ key: string; value: string; comment?: string }> = []
	let currentComment: string | undefined

	for (const line of lines) {
		const trimmed = line.trim()

		if (trimmed.startsWith('#')) {
			currentComment = line
			continue
		}

		if (trimmed === '') {
			currentComment = undefined
			continue
		}

		const match = line.match(/^([^=]+)=(.*)$/)
		if (match) {
			const key = match[1].trim()
			const value = match[2].trim()
			entries.push({
				key,
				value,
				comment: currentComment,
			})
			currentComment = undefined
		}
	}

	return { entries, raw: content }
}

function formatEnvEntry(entry: { key: string; value: string; comment?: string }): string {
	let result = ''
	if (entry.comment) {
		result += entry.comment + '\n'
	}
	result += `${entry.key}=${entry.value}`

	return result
}

async function resolveValue(
	key: string,
	exampleValue: string,
	currentValue: string | undefined,
	interactive: boolean,
): Promise<string> {
	if (!interactive) {
		return currentValue ?? exampleValue
	}

	if (currentValue === undefined) {
		if (exampleValue === '""' || exampleValue === "''") {
			const userValue = await input({
				message: `Enter value for ${chalk.cyan(key)} (press Enter for empty):`,
				default: '',
			})

			return userValue === '' ? '""' : userValue
		}

		return exampleValue
	}

	if (currentValue === exampleValue) {
		return currentValue
	}

	if (exampleValue === '""' || exampleValue === "''" || exampleValue === '') {
		return currentValue
	}

	const choice = await select({
		message: `Conflict for ${chalk.cyan(key)}:`,
		choices: [
			{
				name: `Keep current: ${chalk.green(currentValue)}`,
				value: 'current',
			},
			{
				name: `Use example: ${chalk.yellow(exampleValue)}`,
				value: 'example',
			},
		],
		default: 'current',
	})

	return choice === 'current' ? currentValue : exampleValue
}

export async function syncEnvFiles(options: SyncOptions = {}): Promise<void> {
	const envExampleFile = options.envExampleFile || '.env.example'
	const envFile = options.envFile || '.env'
	const interactive = options.interactive ?? true

	const spinner = interactive ? ora('Reading environment files...').start() : null

	try {
		if (!existsSync(envExampleFile)) {
			spinner?.fail(`${envExampleFile} file not found`)
			throw new Error(`${envExampleFile} file not found`)
		}

		const exampleContent = readFileSync(envExampleFile, 'utf-8')
		const exampleParsed = parseEnvFile(exampleContent)

		let currentParsed: ParsedEnv = { entries: [], raw: '' }
		if (existsSync(envFile)) {
			const currentContent = readFileSync(envFile, 'utf-8')
			currentParsed = parseEnvFile(currentContent)
		}

		spinner?.succeed('Environment files loaded')

		const currentEnvMap = new Map(currentParsed.entries.map((e) => [e.key, e.value]))

		const mergedEntries: Array<{ key: string; value: string; comment?: string }> = []
		const usedKeys = new Set<string>()

		for (const exampleEntry of exampleParsed.entries) {
			const currentValue = currentEnvMap.get(exampleEntry.key)
			const resolvedValue = await resolveValue(
				exampleEntry.key,
				exampleEntry.value,
				currentValue,
				interactive,
			)

			mergedEntries.push({
				...exampleEntry,
				value: resolvedValue,
			})
			usedKeys.add(exampleEntry.key)
		}

		const strayEntries = currentParsed.entries
			.filter((e) => !usedKeys.has(e.key))
			.sort((a, b) => a.key.localeCompare(b.key))

		const writeSpinner = interactive ? ora('Writing synchronized .env file...').start() : null

		const output: string[] = []

		for (let i = 0; i < mergedEntries.length; i++) {
			const entry = mergedEntries[i]
			const prevEntry = i > 0 ? mergedEntries[i - 1] : undefined

			if (entry.comment && prevEntry && !prevEntry.comment) {
				output.push('')
			}

			output.push(formatEnvEntry(entry))
		}

		if (strayEntries.length > 0) {
			output.push('')
			output.push('# Additional environment variables')
			for (const entry of strayEntries) {
				output.push(`${entry.key}=${entry.value}`)
			}
		}

		const finalContent = output.join('\n')
		writeFileSync(envFile, finalContent)

		writeSpinner?.succeed(
			chalk.green(`Successfully synced ${chalk.bold(envFile)} with ${chalk.bold(envExampleFile)}`),
		)

		if (strayEntries.length > 0 && interactive) {
			console.log(
				chalk.yellow(
					`\n⚠ ${String(strayEntries.length)} additional variables were moved to the bottom of ${envFile}`,
				),
			)
		}
	} catch (error) {
		spinner?.fail('Failed to sync environment files')
		throw error
	}
}

export default syncEnvFiles
