import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import extractEnvironmentVariablesFromFileLines from './extract-environment-variables-from-file-lines.js'
import extractKeyValueFromString from './extract-key-value-from-string.js'

describe('CLI - File Writing Logic', () => {
  let tempDir: string

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'synv-write-test-'))
  })

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  // Simulate the core logic of the CLI without the interactive parts
  async function syncEnvFiles(
    envExamplePath: string,
    envPath: string,
    options: {
      skipBackup?: boolean
      choices?: Record<string, 'current' | 'example' | 'custom'>
      customValues?: Record<string, string>
      newValues?: Record<string, string>
    } = {}
  ) {
    // Read files
    const envExampleContent = await fs.readFile(envExamplePath, 'utf8')
    const envExampleLines = envExampleContent.split('\n')
    
    let envLines: string[] = []
    try {
      const envContent = await fs.readFile(envPath, 'utf8')
      envLines = envContent.split('\n')
    } catch {
      // File doesn't exist, create empty
      await fs.writeFile(envPath, '', 'utf8')
    }

    // Create backup if needed
    if (!options.skipBackup && envLines.length > 0) {
      await fs.copyFile(envPath, `${envPath}.backup`)
    }

    // Extract variables
    const envFileVariables = extractEnvironmentVariablesFromFileLines(envLines)
    const envExampleFileVariables = extractEnvironmentVariablesFromFileLines(envExampleLines)

    // Build new content
    const newEnvLines: string[] = []
    const processedKeys = new Set<string>()

    for (const line of envExampleLines) {
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

      const currentValue = exampleEnvVar.key in envFileVariables && envFileVariables[exampleEnvVar.key]
      
      if (currentValue !== false) {
        // Variable exists in current .env
        if (exampleEnvVar.value === '' || currentValue === exampleEnvVar.value) {
          // Values match or example is empty - keep current
          newEnvLines.push(`${exampleEnvVar.key}="${currentValue}"`)
        } else {
          // Values differ - use choice from options
          const choice = options.choices?.[exampleEnvVar.key] || 'current'
          
          switch (choice) {
            case 'example':
              newEnvLines.push(`${exampleEnvVar.key}="${exampleEnvVar.value}"`)
              break
            case 'custom':
              const customValue = options.customValues?.[exampleEnvVar.key] || currentValue
              newEnvLines.push(`${exampleEnvVar.key}="${customValue}"`)
              break
            case 'current':
            default:
              newEnvLines.push(`${exampleEnvVar.key}="${currentValue}"`)
              break
          }
        }
      } else {
        // Variable doesn't exist - use new value or example
        const newValue = options.newValues?.[exampleEnvVar.key] || exampleEnvVar.value || ''
        newEnvLines.push(`${exampleEnvVar.key}="${newValue}"`)
      }
    }

    // Add any variables from existing .env that weren't in .env.example
    for (const [key, value] of Object.entries(envFileVariables)) {
      if (!processedKeys.has(key)) {
        newEnvLines.push(`${key}="${value}"`)
      }
    }

    // Write the new content
    const newEnvContent = newEnvLines.join('\n')
    await fs.writeFile(envPath, newEnvContent, 'utf8')

    return newEnvContent
  }

  describe('Creating and editing .env file', () => {
    it('should create .env file when it does not exist', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')

      // Create .env.example
      const envExampleContent = `# Test Configuration
NODE_ENV=development
PORT=3000
API_KEY=
DATABASE_URL=postgresql://localhost:5432/testdb
FEATURE_FLAG=true`

      await fs.writeFile(envExamplePath, envExampleContent)

      // Sync files
      const result = await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: true,
        newValues: {
          API_KEY: 'test-api-key'
        }
      })

      // Verify .env was created
      const envExists = await fs.access(envPath).then(() => true).catch(() => false)
      expect(envExists).toBe(true)

      // Verify content
      expect(result).toContain('NODE_ENV="development"')
      expect(result).toContain('PORT="3000"')
      expect(result).toContain('API_KEY="test-api-key"')
      expect(result).toContain('DATABASE_URL="postgresql://localhost:5432/testdb"')
      expect(result).toContain('FEATURE_FLAG="true"')
    })

    it('should edit existing .env file and preserve additional variables', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')

      // Create .env.example
      await fs.writeFile(envExamplePath, `NODE_ENV=production
PORT=8080
API_KEY=
NEW_VAR=default-value`)

      // Create existing .env
      await fs.writeFile(envPath, `NODE_ENV=development
PORT=3000
API_KEY=existing-key
EXTRA_VAR=should-be-preserved
ANOTHER_EXTRA=also-preserved`)

      // Sync files - keep all current values
      const result = await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: true,
        choices: {
          NODE_ENV: 'current',
          PORT: 'current'
        },
        newValues: {
          NEW_VAR: 'default-value'
        }
      })

      // Verify content
      expect(result).toContain('NODE_ENV="development"')
      expect(result).toContain('PORT="3000"')
      expect(result).toContain('API_KEY="existing-key"')
      expect(result).toContain('NEW_VAR="default-value"')
      expect(result).toContain('EXTRA_VAR="should-be-preserved"')
      expect(result).toContain('ANOTHER_EXTRA="also-preserved"')
    })

    it('should create backup file when not skipped', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')
      const backupPath = `${envPath}.backup`

      // Create files
      await fs.writeFile(envExamplePath, 'NODE_ENV=production')
      const originalContent = 'NODE_ENV=development\nAPI_KEY=old-key'
      await fs.writeFile(envPath, originalContent)

      // Sync without skipping backup
      await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: false
      })

      // Verify backup was created
      const backupExists = await fs.access(backupPath).then(() => true).catch(() => false)
      expect(backupExists).toBe(true)

      // Verify backup content
      const backupContent = await fs.readFile(backupPath, 'utf8')
      expect(backupContent).toBe(originalContent)
    })

    it('should handle empty .env.example gracefully', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')

      // Create empty .env.example
      await fs.writeFile(envExamplePath, '')

      // Sync files
      const result = await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: true
      })

      // Should create empty .env
      const envExists = await fs.access(envPath).then(() => true).catch(() => false)
      expect(envExists).toBe(true)
      expect(result).toBe('')
    })

    it('should preserve comments and empty lines', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')

      // Create .env.example with comments
      const envExampleContent = `# Application Settings
NODE_ENV=production

# Database
DATABASE_URL=

# This is a comment
API_KEY=secret`

      await fs.writeFile(envExamplePath, envExampleContent)

      // Sync files
      const result = await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: true,
        newValues: {
          DATABASE_URL: 'postgres://localhost'
        }
      })

      // Verify structure is preserved
      const lines = result.split('\n')
      expect(lines[0]).toBe('# Application Settings')
      expect(lines[1]).toBe('NODE_ENV="production"')
      expect(lines[2]).toBe('')
      expect(lines[3]).toBe('# Database')
      expect(lines[4]).toBe('DATABASE_URL="postgres://localhost"')
      expect(lines[5]).toBe('')
      expect(lines[6]).toBe('# This is a comment')
      expect(lines[7]).toBe('API_KEY="secret"')
    })

    it('should use example values when specified', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')

      // Create files
      await fs.writeFile(envExamplePath, `NODE_ENV=production
PORT=8080`)
      await fs.writeFile(envPath, `NODE_ENV=development
PORT=3000`)

      // Sync with "use example" choices
      const result = await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: true,
        choices: {
          NODE_ENV: 'example',
          PORT: 'example'
        }
      })

      // Should use example values
      expect(result).toContain('NODE_ENV="production"')
      expect(result).toContain('PORT="8080"')
    })

    it('should handle custom values correctly', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')

      // Create files
      await fs.writeFile(envExamplePath, 'DATABASE_URL=postgresql://localhost:5432/mydb')
      await fs.writeFile(envPath, 'DATABASE_URL=postgresql://localhost:5432/olddb')

      // Sync with custom value
      const result = await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: true,
        choices: {
          DATABASE_URL: 'custom'
        },
        customValues: {
          DATABASE_URL: 'postgresql://remote:5432/newdb'
        }
      })

      // Should use custom value
      expect(result).toBe('DATABASE_URL="postgresql://remote:5432/newdb"')
    })

    it('should handle variables with special characters', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')

      // Create .env.example with special characters
      await fs.writeFile(envExamplePath, `API_KEY=sk_test_123
CONNECTION_STRING="Server=localhost;Database=mydb;User Id=sa;Password=P@ssw0rd!"`)

      // Sync files
      const result = await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: true
      })

      // Verify special characters are preserved
      expect(result).toContain('API_KEY="sk_test_123"')
      expect(result).toContain('CONNECTION_STRING="Server=localhost;Database=mydb;User Id=sa;Password=P@ssw0rd!"')
    })

    it('should handle single line values correctly', async () => {
      const envExamplePath = path.join(tempDir, '.env.example')
      const envPath = path.join(tempDir, '.env')

      // Create files with various value formats
      await fs.writeFile(envExamplePath, `SINGLE_LINE=value
QUOTED_VALUE="already quoted"
EMPTY_VALUE=`)

      // Sync files
      const result = await syncEnvFiles(envExamplePath, envPath, {
        skipBackup: true
      })

      // Verify content
      expect(result).toContain('SINGLE_LINE="value"')
      expect(result).toContain('QUOTED_VALUE="already quoted"')
      expect(result).toContain('EMPTY_VALUE=""')
    })
  })
})
