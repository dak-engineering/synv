#!/usr/bin/env node
import chalk from 'chalk'
import { command, option, optional, run, string } from 'cmd-ts'

import syncEnvFiles from './index.js'

const app = command({
	name: 'synv',
	description: 'Sync your .env file with .env.example',
	version: '0.1.5',
	args: {
		input: option({
			short: 'i',
			long: 'env-example-file',
			type: optional(string),
			description: 'Path to the .env.example file (default: .env.example)',
		}),
		output: option({
			short: 'o',
			long: 'env-file',
			type: optional(string),
			description: 'Path to the .env file (default: .env)',
		}),
	},
	handler: async ({ input, output }) => {
		try {
			await syncEnvFiles({
				envExampleFile: input,
				envFile: output,
				interactive: !process.env.CI,
			})
		} catch (error) {
			console.error(chalk.red('Error:'), error instanceof Error ? error.message : error)
			process.exit(1)
		}
	},
})

void run(app, process.argv.slice(2))
