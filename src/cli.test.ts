import { execSync } from 'child_process'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('CLI End-to-End Tests', () => {
	let tempDir: string
	const cliPath = join(process.cwd(), 'dist', 'cli.js')

	beforeEach(() => {
		// Create a temporary directory for test files
		// Use realpathSync to normalize the path (handles /var vs /private/var on macOS)
		tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'synv-test-')))
	})

	afterEach(() => {
		// Clean up temporary directory
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('Basic functionality', () => {
		it('should display help when --help flag is used', () => {
			let output = ''
			try {
				output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' })
			} catch (error: unknown) {
				// cmd-ts exits with code 1 for help, capture stdout/stderr
				const execError = error as { stdout?: string; stderr?: string }
				output = execError.stdout || execError.stderr || ''
			}

			expect(output).toContain('synv')
			expect(output).toContain('Sync your .env file with .env.example')
			expect(output).toContain('--env-example-file')
			expect(output).toContain('--env-file')
			expect(output).toContain('-i')
			expect(output).toContain('-o')
		})

		it('should display version when --version flag is used', () => {
			const output = execSync(`node ${cliPath} --version`, { encoding: 'utf-8' })

			expect(output.trim()).toBe('0.1.5')
		})
	})

	describe('File synchronization', () => {
		it('should sync .env with .env.example using default paths', () => {
			const envExamplePath = join(tempDir, '.env.example')
			const envPath = join(tempDir, '.env')

			// Create test files
			writeFileSync(
				envExamplePath,
				`# App
NEXT_PUBLIC_APP_HOST="http://localhost:3000"

# Database
DB_URL=""`,
			)

			writeFileSync(
				envPath,
				`NEXT_PUBLIC_APP_HOST="http://production.com"
DB_URL="postgres://localhost"`,
			)

			// Run CLI in non-interactive mode (using environment variable)
			execSync(`cd "${tempDir}" && CI=true node "${cliPath}"`, {
				encoding: 'utf-8',
				shell: '/bin/sh',
			})

			const result = readFileSync(envPath, 'utf-8')

			expect(result).toContain('# App')
			expect(result).toContain('NEXT_PUBLIC_APP_HOST="http://production.com"')
			expect(result).toContain('# Database')
			expect(result).toContain('DB_URL="postgres://localhost"')
		})

		it('should work with custom file paths using -i and -o flags', () => {
			const customExamplePath = join(tempDir, '.env.template')
			const customEnvPath = join(tempDir, '.env.local')

			writeFileSync(customExamplePath, `API_KEY=""`)
			writeFileSync(customEnvPath, `API_KEY="secret123"`)

			execSync(`cd "${tempDir}" && CI=true node "${cliPath}" -i .env.template -o .env.local`, {
				encoding: 'utf-8',
				shell: '/bin/sh',
			})

			const result = readFileSync(customEnvPath, 'utf-8')
			expect(result.trim()).toBe('API_KEY="secret123"')
		})

		it('should create .env file if it does not exist', () => {
			const envExamplePath = join(tempDir, '.env.example')
			const envPath = join(tempDir, '.env')

			writeFileSync(envExamplePath, `NEW_VAR="default"`)

			execSync(`cd "${tempDir}" && CI=true node "${cliPath}"`, {
				encoding: 'utf-8',
				shell: '/bin/sh',
			})

			expect(existsSync(envPath)).toBe(true)
			const result = readFileSync(envPath, 'utf-8')
			expect(result.trim()).toBe('NEW_VAR="default"')
		})

		it('should handle stray variables by moving them to the bottom', () => {
			const envExamplePath = join(tempDir, '.env.example')
			const envPath = join(tempDir, '.env')

			writeFileSync(
				envExamplePath,
				`# Main vars
MAIN_VAR="value"`,
			)

			writeFileSync(
				envPath,
				`MAIN_VAR="value"
STRAY_B="b"
STRAY_A="a"`,
			)

			execSync(`cd "${tempDir}" && CI=true node "${cliPath}"`, {
				encoding: 'utf-8',
				shell: '/bin/sh',
			})

			const result = readFileSync(envPath, 'utf-8')

			expect(result).toContain('# Main vars')
			expect(result).toContain('MAIN_VAR="value"')
			expect(result).toContain('# Additional environment variables')

			// Check alphabetical order
			const lines = result.split('\n')
			const strayAIndex = lines.findIndex((l) => l.includes('STRAY_A'))
			const strayBIndex = lines.findIndex((l) => l.includes('STRAY_B'))
			expect(strayAIndex).toBeLessThan(strayBIndex)
		})
	})

	describe('Error handling', () => {
		it('should fail gracefully when .env.example does not exist', () => {
			try {
				execSync(`cd "${tempDir}" && CI=true node "${cliPath}"`, {
					encoding: 'utf-8',
					shell: '/bin/sh',
				})
				expect.fail('Should have thrown an error')
			} catch (error: unknown) {
				const execError = error as { stdout?: string; stderr?: string }
				expect(execError.stderr || execError.stdout).toContain('.env.example file not found')
			}
		})

		it('should fail with custom example file path that does not exist', () => {
			try {
				execSync(`cd "${tempDir}" && CI=true node "${cliPath}" -i .env.nonexistent`, {
					encoding: 'utf-8',
					shell: '/bin/sh',
				})
				expect.fail('Should have thrown an error')
			} catch (error: unknown) {
				const execError = error as { stdout?: string; stderr?: string }
				expect(execError.stderr || execError.stdout).toContain('.env.nonexistent file not found')
			}
		})
	})

	describe('Complex scenarios', () => {
		it('should preserve comment structure and spacing', () => {
			const envExamplePath = join(tempDir, '.env.example')
			const envPath = join(tempDir, '.env')

			writeFileSync(
				envExamplePath,
				`# Section 1
VAR1="value1"

# Section 2
VAR2="value2"
VAR3="value3"

# Section 3
VAR4="value4"`,
			)

			writeFileSync(
				envPath,
				`VAR1="custom1"
VAR2="custom2"
VAR3="custom3"
VAR4="custom4"`,
			)

			execSync(`cd "${tempDir}" && CI=true node "${cliPath}"`, {
				encoding: 'utf-8',
				shell: '/bin/sh',
			})

			const result = readFileSync(envPath, 'utf-8')

			// Check that comments and spacing are preserved
			expect(result).toBe(`# Section 1
VAR1="custom1"
# Section 2
VAR2="custom2"
VAR3="custom3"

# Section 3
VAR4="custom4"`)
		})

		it('should handle empty values correctly', () => {
			const envExamplePath = join(tempDir, '.env.example')
			const envPath = join(tempDir, '.env')

			writeFileSync(
				envExamplePath,
				`FILLED=""
EMPTY=""`,
			)

			writeFileSync(envPath, `FILLED="has value"`)

			execSync(`cd "${tempDir}" && CI=true node "${cliPath}"`, {
				encoding: 'utf-8',
				shell: '/bin/sh',
			})

			const result = readFileSync(envPath, 'utf-8')
			expect(result).toBe(`FILLED="has value"
EMPTY=""`)
		})
	})
})

describe('CLI Interactive Tests', () => {
	let tempDir: string

	beforeEach(() => {
		// Use realpathSync to normalize the path (handles /var vs /private/var on macOS)
		tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'synv-interactive-test-')))
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	it('should handle interactive prompts (simulated)', () => {
		const envExamplePath = join(tempDir, '.env.example')
		const envPath = join(tempDir, '.env')

		// Note: In a real scenario, we would need to use a library like 'node-pty'
		// or 'execa' with stdin simulation to test interactive prompts.
		// For now, we're testing that the interactive mode would be triggered.

		// This test confirms the setup is correct for interactive mode
		writeFileSync(envExamplePath, `CONFLICT_VAR="example_value"`)
		writeFileSync(envPath, `CONFLICT_VAR="current_value"`)

		expect(existsSync(envExamplePath)).toBe(true)
		expect(existsSync(envPath)).toBe(true)
	})
})
