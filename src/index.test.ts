import * as fs from 'fs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { syncEnvFiles } from './index'

vi.mock('fs', () => ({
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
	existsSync: vi.fn(),
}))

vi.mock('@inquirer/prompts', () => ({
	select: vi.fn(),
	input: vi.fn(),
}))

describe('syncEnvFiles', () => {
	const mockedReadFileSync = fs.readFileSync as Mock
	const mockedWriteFileSync = fs.writeFileSync as Mock
	const mockedExistsSync = fs.existsSync as Mock

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should sync .env with .env.example format and content', async () => {
		const envExampleContent = `# App
NEXT_PUBLIC_APP_HOST="http://localhost:3000"

# CMS
PAYLOAD_SECRET="abc123"
DRAFT_MODE_SECRET="abc123"

# Turso
TURSO_DATABASE_URL="libsql://localhost:8080"
TURSO_AUTH_TOKEN=""`

		const envContent = `NEXT_PUBLIC_APP_HOST="http://localhost:3000"
PAYLOAD_SECRET="abc123"
DRAFT_MODE_SECRET="abc123"
TURSO_DATABASE_URL="libsql://localhost:8080"
TURSO_AUTH_TOKEN="1234"`

		mockedExistsSync.mockImplementation((path) => {
			return path.endsWith('.env.example') || path.endsWith('.env')
		})

		mockedReadFileSync.mockImplementation((path) => {
			if (path.endsWith('.env.example')) return envExampleContent
			if (path.endsWith('.env')) return envContent
			throw new Error('File not found')
		})

		await syncEnvFiles({ interactive: false })

		const expectedOutput = `# App
NEXT_PUBLIC_APP_HOST="http://localhost:3000"
# CMS
PAYLOAD_SECRET="abc123"
DRAFT_MODE_SECRET="abc123"

# Turso
TURSO_DATABASE_URL="libsql://localhost:8080"
TURSO_AUTH_TOKEN="1234"`

		expect(mockedWriteFileSync).toHaveBeenCalledWith(
			expect.stringContaining('.env'),
			expectedOutput,
		)
	})

	it('should handle stray environment variables', async () => {
		const envExampleContent = `# App
NEXT_PUBLIC_APP_HOST="http://localhost:3000"`

		const envContent = `NEXT_PUBLIC_APP_HOST="http://localhost:3000"
STRAY_VAR_B="value_b"
STRAY_VAR_A="value_a"
ANOTHER_VAR="another_value"`

		mockedExistsSync.mockImplementation((path) => {
			return path.endsWith('.env.example') || path.endsWith('.env')
		})

		mockedReadFileSync.mockImplementation((path) => {
			if (path.endsWith('.env.example')) return envExampleContent
			if (path.endsWith('.env')) return envContent
			throw new Error('File not found')
		})

		await syncEnvFiles({ interactive: false })

		const expectedOutput = `# App
NEXT_PUBLIC_APP_HOST="http://localhost:3000"

# Additional environment variables
ANOTHER_VAR="another_value"
STRAY_VAR_A="value_a"
STRAY_VAR_B="value_b"`

		expect(mockedWriteFileSync).toHaveBeenCalledWith(
			expect.stringContaining('.env'),
			expectedOutput,
		)
	})

	it('should create .env file if it does not exist', async () => {
		const envExampleContent = `# App
NEXT_PUBLIC_APP_HOST="http://localhost:3000"

# CMS
PAYLOAD_SECRET="abc123"`

		mockedExistsSync.mockImplementation((path) => {
			return path.endsWith('.env.example')
		})

		mockedReadFileSync.mockImplementation((path) => {
			if (path.endsWith('.env.example')) return envExampleContent
			throw new Error('File not found')
		})

		await syncEnvFiles({ interactive: false })

		const expectedOutput = `# App
NEXT_PUBLIC_APP_HOST="http://localhost:3000"
# CMS
PAYLOAD_SECRET="abc123"`

		expect(mockedWriteFileSync).toHaveBeenCalledWith(
			expect.stringContaining('.env'),
			expectedOutput,
		)
	})

	it('should handle custom file paths', async () => {
		const envExampleContent = `KEY="value"`
		const envContent = `KEY="different"`

		mockedExistsSync.mockImplementation((path) => {
			return path.endsWith('.env.custom.example') || path.endsWith('.env.custom')
		})

		mockedReadFileSync.mockImplementation((path) => {
			if (path.endsWith('.env.custom.example')) return envExampleContent
			if (path.endsWith('.env.custom')) return envContent
			throw new Error('File not found')
		})

		await syncEnvFiles({
			envExampleFile: '.env.custom.example',
			envFile: '.env.custom',
			interactive: false,
		})

		expect(mockedWriteFileSync).toHaveBeenCalledWith(
			expect.stringContaining('.env.custom'),
			'KEY="different"',
		)
	})

	it('should throw error if .env.example does not exist', async () => {
		mockedExistsSync.mockReturnValue(false)

		await expect(syncEnvFiles({ interactive: false })).rejects.toThrow(
			'.env.example file not found',
		)
	})

	it('should handle empty values from example', async () => {
		const envExampleContent = `DATABASE_URL=""
API_KEY=""`

		const envContent = `DATABASE_URL="postgres://localhost"
API_KEY=""`

		mockedExistsSync.mockImplementation((path) => {
			return path.endsWith('.env.example') || path.endsWith('.env')
		})

		mockedReadFileSync.mockImplementation((path) => {
			if (path.endsWith('.env.example')) return envExampleContent
			if (path.endsWith('.env')) return envContent
			throw new Error('File not found')
		})

		await syncEnvFiles({ interactive: false })

		const expectedOutput = `DATABASE_URL="postgres://localhost"
API_KEY=""`

		expect(mockedWriteFileSync).toHaveBeenCalledWith(
			expect.stringContaining('.env'),
			expectedOutput,
		)
	})
})
