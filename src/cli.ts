#!/usr/bin/env node
import { command, run, string, option, flag, boolean } from 'cmd-ts'
import { search, confirm, select, input } from '@inquirer/prompts'
import chalk from 'chalk'
import fs from 'node:fs/promises'
import fuzz from 'fuzzbunny'
import path from 'node:path'
import ora from 'ora'
import extractEnvironmentVariablesFromFileLines from './extract-environment-variables-from-file-lines.js'
import extractKeyValueFromString from './extract-key-value-from-string.js'

const { bold, green, red } = chalk

const cwdFiles = await fs.readdir('.')

const syncCommand = command({
	name: 'synv',
	description: 'Synchronise your stuff',
	args: {
		envExampleFilePath: option({
			type: string,
			long: 'env-example-file',
			short: 'x',
			description: 'Relative path to .env.example file',
			defaultValue: () => '.env.example',
		}),
		envFilePath: option({
			type: string,
			long: 'env-file',
			short: 'e',
			description: 'Relative path to .env file',
			defaultValue: () => '.env',
		}),
		skipBackup: flag({
			long: 'skip-backup',
			description: 'Skip backing up the .env file',
			type: boolean,
			defaultValue: () => {
				return false
			},
		}),
		quiet: flag({
			long: 'quiet',
			description: 'Suppress output',
			type: boolean,
			defaultValue: () => {
				return false
			},
		}),
	},
	async handler(inputs) {
		const log = (...messages: string[]) => {
			if (!inputs.quiet) {
				console.log(...messages)
			}
		}

		const envExampleFile = await getFileContentsByLine({
			relativeFilePath: inputs.envExampleFilePath,
			files: cwdFiles,
			defaultFileName: '.env.example',
		})

		const envFile = await getFileContentsByLine({
			relativeFilePath: inputs.envFilePath,
			files: cwdFiles,
			defaultFileName: '.env',
			createIfNotExists: true,
		})

		if (!inputs.skipBackup) {
			await backupFile(envFile.path)
		}

		const envFileVariables = extractEnvironmentVariablesFromFileLines(envFile.lines)
		const envExampleFileVariables = extractEnvironmentVariablesFromFileLines(envExampleFile.lines)

		const newEnvLines: string[] = []
		const processedKeys = new Set<string>()
		
		for (const line of envExampleFile.lines) {
			const trimmedLine = line.trim()

			if (trimmedLine === '' || trimmedLine.startsWith('#')) {
				newEnvLines.push(line)
				continue
			}

			const exampleEnvVar = extractKeyValueFromString(line)
			if (!exampleEnvVar) {
				newEnvLines.push(line)
				continue
			}

			processedKeys.add(exampleEnvVar.key)

			const currentValue = envFileVariables[exampleEnvVar.key]
			const hasCurrentValue = currentValue !== undefined
			
			if (hasCurrentValue) {
				const valuesMatch = exampleEnvVar.value === '' || currentValue === exampleEnvVar.value
				
				if (valuesMatch) {
					log(`Keeping ${bold(exampleEnvVar.key)}`)
					newEnvLines.push(`${exampleEnvVar.key}="${currentValue}"`)
				} else {
					const choice = await select({
						message: `${exampleEnvVar.key} differs`,
						choices: [
							{ name: 'Keep current', value: 'current' },
							{ name: 'Use example', value: 'example' },
							{ name: 'Enter new', value: 'custom' },
						],
					})

					switch (choice) {
						case 'example':
							newEnvLines.push(`${exampleEnvVar.key}="${exampleEnvVar.value}"`)
							break
						case 'current':
							newEnvLines.push(`${exampleEnvVar.key}="${currentValue}"`)
							break
						case 'custom':
							const newValue = await input({
								message: `Enter value for ${exampleEnvVar.key}`,
							})
							newEnvLines.push(`${exampleEnvVar.key}="${newValue}"`)
							break
						default:
							newEnvLines.push(`${exampleEnvVar.key}="${currentValue}"`)
							break
					}
				}
			} else {
				const newValue = await input({
					message: `Enter value for ${exampleEnvVar.key}`,
					default: exampleEnvVar.value || undefined,
				})
				newEnvLines.push(`${exampleEnvVar.key}="${newValue}"`)
			}
		}

		// Add any variables from existing .env that weren't in .env.example
		for (const [key, value] of Object.entries(envFileVariables)) {
			if (!processedKeys.has(key)) {
				log(`Preserving additional variable ${bold(key)}`)
				newEnvLines.push(`${key}="${value}"`)
			}
		}

		// Write the new content to the .env file
		const newEnvContent = newEnvLines.join('\n')
		await fs.writeFile(envFile.path, newEnvContent, 'utf8')
		log(green(`✓ Successfully updated ${bold(path.basename(envFile.path))}`))
	}
})

const backupFile = async (filepath: string) => {
	await loadWhile('Backing up .env file', async () => {
		await fs.copyFile(filepath, `${filepath}.backup`)
	}, {
		successMessage: `Backup of ${bold(path.basename(filepath))} complete`,
	})
}

const getFileContentsByLine = async ({
	relativeFilePath,
	files,
	defaultFileName,
	createIfNotExists = false,
}: {
	relativeFilePath?: string
	files: string[]
	defaultFileName?: string
	createIfNotExists?: boolean
}) => {
	const filePath = (relativeFilePath && path.join(process.cwd(), relativeFilePath)) ??
		(defaultFileName && await loadWhile(`Attempting to auto-detect ${bold(defaultFileName)} file path`, async () => {
			return await autoDetectFilePath(files, defaultFileName)
		}, {
			successMessage: `Found ${defaultFileName} file`,
			throwOnError: false,
		})) ??
		await promptForFilePath(files, 'Select your .env.example file')

	const fileExists = await checkFileExists(filePath)

	if (!fileExists && !createIfNotExists) {
		console.error(red('File not found:'), filePath)
		process.exit(1)
	} else if (!fileExists && createIfNotExists) {
		await fs.writeFile(filePath, '')
	}

	return {
		path: filePath,
		lines: await getFileLinesInArray(filePath),
	}
}

type LoadWhileOptions<T> = {
	successMessage?: string | ((result: T) => string)
	failureMessage?: string | ((error: Error) => string)
	throwOnError?: boolean
}

const loadWhile = async <T>(
	message: string,
	callback: () => T,
	options: LoadWhileOptions<T> = {}
): Promise<T | null> => {
	const { successMessage, failureMessage, throwOnError = true } = options
	const spinner = ora(message).start()

	try {
		const result = await callback()
		
		const finalMessage = typeof successMessage === 'function'
			? successMessage(result)
			: successMessage ?? message
		
		spinner.succeed(finalMessage)
		return result
	} catch (error) {
		const errorObj = error instanceof Error ? error : new Error('Unknown error has occurred.')
		
		if (failureMessage) {
			const finalFailureMessage = typeof failureMessage === 'function'
				? failureMessage(errorObj)
				: failureMessage
			spinner.fail(finalFailureMessage)
		} else {
			spinner.fail(errorObj.message)
		}

		if (throwOnError) {
			throw error
		}

		return null
	}
}

const getFileLinesInArray = async (filepath: string) => {
	const fileContents = await fs.readFile(filepath, 'utf8')

	return fileContents.split('\n')
}

const checkFileExists = async (filepath: string) => {
	try {
		await fs.access(filepath)

		return true
	} catch {
		return false
	}
}

const promptForFilePath = async (files: string[], message: string) => {
	return search({
		message,
		source: async (input) => {
			if (!input) {
				return files.map((name, value) => {
					return {
						name,
						value: path.join(process.cwd(), name),
					}
				})
			}

			return highlightFuzzyMatches(cwdFiles, input)
		}
	})
}

const highlightFuzzyMatches = (files: string[], input: string) => {
	const fileItems = files.map(filename => ({ filename }))
	
	const matches = fuzz.fuzzyFilter(fileItems, input, {
		fields: ['filename'],
	})

	const highlightedMatches = matches.map((match) => {
		if (!match.highlights.filename) {
			return match.item.filename
		}

		return match.highlights.filename
			.map((namePiece, index) => {
				// Even indices are non-matching parts, odd indices are matches
				return index % 2 === 0 ? namePiece : green(bold(namePiece))
			})
			.join('')
	})

	return highlightedMatches.map((name) => ({
		name,
		value: path.join(process.cwd(), name),
	}))
}

const autoDetectFilePath = async (files: string[], filenameToDetect: string) => {
	const hasEnvExampleFile = files.includes(filenameToDetect)

	if (hasEnvExampleFile) {
		const confirmed = await promptToConfirmEnvExampleFile()

		if (confirmed) {
			return path.join(process.cwd(), filenameToDetect)
		}
	}

	throw new Error(`Could not auto-detect ${filenameToDetect}`)
}

const promptToConfirmEnvExampleFile = () => {
	return confirm({
		message: 'Use this file? (.env.example)',
	})
}

void run(syncCommand, process.argv.slice(2));
