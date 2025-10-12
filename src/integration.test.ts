import { describe, it, expect, beforeEach } from 'vitest'
import extractEnvironmentVariablesFromFileLines from './extract-environment-variables-from-file-lines'
import extractKeyValueFromString from './extract-key-value-from-string'
import extractEnvironmentVariableValueFromLine from './extract-environment-variable-value-from-line'

describe('Integration Tests - Full .env Processing', () => {
  describe('Complete .env.example to .env transformation', () => {
    const envExampleContent = `# Application Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Third-party Services
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-app-uploads

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_BETA_FEATURES=false
DEBUG_MODE=false

# URLs and Endpoints
API_BASE_URL=https://api.example.com
FRONTEND_URL=https://example.com
WEBHOOK_ENDPOINT=https://api.example.com/webhooks

# Monitoring
SENTRY_DSN=
LOG_LEVEL=info
# Options: error, warn, info, debug, trace

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@example.com

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
# 10MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Cache Configuration
CACHE_TTL=3600
# 1 hour in seconds
CACHE_PREFIX=myapp_

# Miscellaneous
TIMEZONE=UTC
DEFAULT_LANGUAGE=en
MAINTENANCE_MODE=false

# Complex Values
JSON_CONFIG={"key":"value","nested":{"prop":123}}
MULTILINE_VALUE="This is a value that could be long"
SPECIAL_CHARS="!@#$%^&*()_+-=[]{}|;:,.<>?"
PATH_VAR=/usr/local/bin:/usr/bin:/bin
BASE64_SECRET=SGVsbG8gV29ybGQhCg==

# Environment Variables with References
FULL_DATABASE_URL=\${DATABASE_URL}?ssl=true
API_KEY_COMBINED=\${STRIPE_API_KEY}_\${NODE_ENV}

# Empty values that need to be filled
REQUIRED_SECRET=
OPTIONAL_CONFIG=`

    const existingEnvContent = `# Application Configuration
NODE_ENV=development
PORT=4000

# Database Configuration
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/devdb
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=5
REDIS_URL=redis://localhost:6379/1

# Authentication
JWT_SECRET=dev-secret-key-12345
JWT_EXPIRES_IN=30d
BCRYPT_ROUNDS=8

# Third-party Services
STRIPE_API_KEY=sk_test_oldkey123
STRIPE_WEBHOOK_SECRET=whsec_oldwebhook456
SENDGRID_API_KEY=SG.actualkey789
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-west-2
AWS_S3_BUCKET=my-dev-bucket

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_BETA_FEATURES=true
DEBUG_MODE=true

# URLs and Endpoints
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080
WEBHOOK_ENDPOINT=http://localhost:3000/webhooks

# Monitoring
SENTRY_DSN=https://abc123@sentry.io/project
LOG_LEVEL=debug

# Email Configuration
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=testuser
SMTP_PASS=testpass
FROM_EMAIL=test@localhost

# Rate Limiting
RATE_LIMIT_WINDOW=1m
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

# Cache Configuration
CACHE_TTL=60
CACHE_PREFIX=dev_

# Miscellaneous
TIMEZONE=America/New_York
DEFAULT_LANGUAGE=es
MAINTENANCE_MODE=false

# Complex Values
JSON_CONFIG={"key":"devvalue","nested":{"prop":456}}
MULTILINE_VALUE="Dev environment value"
SPECIAL_CHARS=test123
PATH_VAR=/home/user/bin:/usr/local/bin:/usr/bin:/bin
BASE64_SECRET=ZGV2ZWxvcG1lbnQ=

# Custom dev-only variables not in example
DEV_ONLY_VAR=should_be_preserved
ANOTHER_DEV_VAR=keep_this_too`

    it('should extract all variables from .env.example file', () => {
      const lines = envExampleContent.split('\n')
      const variables = extractEnvironmentVariablesFromFileLines(lines)

      // Check that all non-empty variables are extracted
      expect(variables.NODE_ENV).toBe('production')
      expect(variables.PORT).toBe('3000')
      expect(variables.DATABASE_URL).toBe('postgresql://user:password@localhost:5432/mydb')
      expect(variables.JWT_SECRET).toBe('your-secret-key-here')
      expect(variables.ENABLE_ANALYTICS).toBe('true')
      expect(variables.API_BASE_URL).toBe('https://api.example.com')
      expect(variables.LOG_LEVEL).toBe('info')
      expect(variables.RATE_LIMIT_WINDOW).toBe('15m')
      expect(variables.MAX_FILE_SIZE).toBe('10485760')
      expect(variables.CACHE_TTL).toBe('3600')
      expect(variables.TIMEZONE).toBe('UTC')
      expect(variables.JSON_CONFIG).toBe('{"key":"value","nested":{"prop":123}}')
      expect(variables.SPECIAL_CHARS).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?')
      expect(variables.BASE64_SECRET).toBe('SGVsbG8gV29ybGQhCg==')
      
      // Check empty values
      expect(variables.SENDGRID_API_KEY).toBe('')
      expect(variables.AWS_ACCESS_KEY_ID).toBe('')
      expect(variables.SENTRY_DSN).toBe('')
      expect(variables.SMTP_USER).toBe('')
      expect(variables.REQUIRED_SECRET).toBe('')
      expect(variables.OPTIONAL_CONFIG).toBe('')

      // Check that comments are not included
      expect(variables['#']).toBeUndefined()
      expect(variables['Options:']).toBeUndefined()
    })

    it('should extract all variables from existing .env file', () => {
      const lines = existingEnvContent.split('\n')
      const variables = extractEnvironmentVariablesFromFileLines(lines)

      // Check existing values
      expect(variables.NODE_ENV).toBe('development')
      expect(variables.PORT).toBe('4000')
      expect(variables.DATABASE_URL).toBe('postgresql://devuser:devpass@localhost:5432/devdb')
      expect(variables.JWT_SECRET).toBe('dev-secret-key-12345')
      expect(variables.STRIPE_API_KEY).toBe('sk_test_oldkey123')
      expect(variables.SENDGRID_API_KEY).toBe('SG.actualkey789')
      expect(variables.AWS_ACCESS_KEY_ID).toBe('AKIAIOSFODNN7EXAMPLE')
      expect(variables.LOG_LEVEL).toBe('debug')
      expect(variables.SMTP_USER).toBe('testuser')
      expect(variables.CACHE_TTL).toBe('60')
      
      // Check dev-only variables
      expect(variables.DEV_ONLY_VAR).toBe('should_be_preserved')
      expect(variables.ANOTHER_DEV_VAR).toBe('keep_this_too')
    })

    it('should correctly merge .env.example structure with existing .env values', () => {
      const exampleLines = envExampleContent.split('\n')
      const existingLines = existingEnvContent.split('\n')
      
      const exampleVars = extractEnvironmentVariablesFromFileLines(exampleLines)
      const existingVars = extractEnvironmentVariablesFromFileLines(existingLines)
      
      const mergedEnv: string[] = []
      const processedKeys = new Set<string>()

      // Process each line from .env.example
      for (const line of exampleLines) {
        const trimmedLine = line.trim()
        
        // Keep comments and empty lines
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
          mergedEnv.push(line)
          continue
        }

        const keyValue = extractKeyValueFromString(line)
        if (!keyValue) {
          mergedEnv.push(line)
          continue
        }

        processedKeys.add(keyValue.key)

        // Use existing value if available, otherwise use example value
        const value = existingVars[keyValue.key] !== undefined 
          ? existingVars[keyValue.key]
          : keyValue.value

        mergedEnv.push(`${keyValue.key}=${value}`)
      }

      // Add variables that exist in .env but not in .env.example
      mergedEnv.push('')
      mergedEnv.push('# Additional variables from existing .env')
      for (const [key, value] of Object.entries(existingVars)) {
        if (!processedKeys.has(key)) {
          mergedEnv.push(`${key}=${value}`)
        }
      }

      const mergedContent = mergedEnv.join('\n')

      // Verify structure is preserved
      expect(mergedContent).toContain('# Application Configuration')
      expect(mergedContent).toContain('# Database Configuration')
      expect(mergedContent).toContain('# Authentication')
      
      // Verify existing values are used
      expect(mergedContent).toContain('NODE_ENV=development')
      expect(mergedContent).toContain('PORT=4000')
      expect(mergedContent).toContain('DATABASE_URL=postgresql://devuser:devpass@localhost:5432/devdb')
      expect(mergedContent).toContain('JWT_SECRET=dev-secret-key-12345')
      expect(mergedContent).toContain('STRIPE_API_KEY=sk_test_oldkey123')
      expect(mergedContent).toContain('SENDGRID_API_KEY=SG.actualkey789')
      
      // Verify dev-only variables are preserved
      expect(mergedContent).toContain('DEV_ONLY_VAR=should_be_preserved')
      expect(mergedContent).toContain('ANOTHER_DEV_VAR=keep_this_too')
      
      // Verify empty values in example are filled from existing
      expect(mergedContent).toContain('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE')
      expect(mergedContent).toContain('SMTP_USER=testuser')
      
      // Verify comments are preserved
      expect(mergedContent).toContain('# 10MB in bytes')
      expect(mergedContent).toContain('# 1 hour in seconds')
      expect(mergedContent).toContain('# Options: error, warn, info, debug, trace')
    })

    it('should handle edge cases in environment variable processing', () => {
      const edgeCaseContent = `# Edge cases
EMPTY=
EMPTY_QUOTES=""
SINGLE_QUOTES='value'
DOUBLE_QUOTES="value"
WITH_HASH=value#comment
QUOTED_HASH="value#notcomment"
EQUALS_IN_VALUE=key=value=another
SPACES_AROUND=  spaced  
QUOTED_SPACES="  spaced  "
SPECIAL_CHARS="!@#$%^&*()"
URL_WITH_PARAMS=https://api.com?key=value&other=123
JSON={"complex":{"nested":["array",123,true]}}
ESCAPED_QUOTES="He said \\"Hello\\""
BACKTICKS=\`command\`
DOLLAR_SIGN=$100
VARIABLE_REF=\${OTHER_VAR}
MULTIPLE_REFS=\${VAR1}_\${VAR2}
COMMENT_AFTER=value # this is a comment
NO_COMMENT="value # not a comment"
UNICODE=Hello 世界 🌍
LONG_VALUE=${'a'.repeat(1000)}
`

      const lines = edgeCaseContent.split('\n')
      const variables = extractEnvironmentVariablesFromFileLines(lines)

      // Test empty values
      expect(variables.EMPTY).toBe('')
      expect(variables.EMPTY_QUOTES).toBe('')
      
      // Test quoted values
      expect(variables.SINGLE_QUOTES).toBe('value')
      expect(variables.DOUBLE_QUOTES).toBe('value')
      
      // Test hash/comment handling
      expect(variables.WITH_HASH).toBe('value')
      expect(variables.QUOTED_HASH).toBe('value#notcomment')
      
      // Test special characters
      expect(variables.EQUALS_IN_VALUE).toBe('key=value=another')
      expect(variables.SPECIAL_CHARS).toBe('!@#$%^&*()')
      expect(variables.URL_WITH_PARAMS).toBe('https://api.com?key=value&other=123')
      
      // Test spacing
      expect(variables.SPACES_AROUND).toBe('spaced')
      expect(variables.QUOTED_SPACES).toBe('  spaced  ')
      
      // Test complex values
      expect(variables.JSON).toBe('{"complex":{"nested":["array",123,true]}}')
      expect(variables.VARIABLE_REF).toBe('${OTHER_VAR}')
      expect(variables.MULTIPLE_REFS).toBe('${VAR1}_${VAR2}')
      
      // Test comments
      expect(variables.COMMENT_AFTER).toBe('value')
      expect(variables.NO_COMMENT).toBe('value # not a comment')
      
      // Test unicode
      expect(variables.UNICODE).toBe('Hello 世界 🌍')
      
      // Test long value
      expect(variables.LONG_VALUE).toBe('a'.repeat(1000))
    })

    it('should create a properly formatted merged .env file', () => {
      const exampleLines = envExampleContent.split('\n')
      const existingLines = existingEnvContent.split('\n')
      
      const existingVars = extractEnvironmentVariablesFromFileLines(existingLines)
      
      const mergedEnv: string[] = []
      const processedKeys = new Set<string>()

      // Process .env.example maintaining structure
      for (const line of exampleLines) {
        const trimmedLine = line.trim()
        
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
          mergedEnv.push(line)
          continue
        }

        const keyValue = extractKeyValueFromString(line)
        if (!keyValue) {
          mergedEnv.push(line)
          continue
        }

        processedKeys.add(keyValue.key)
        const value = existingVars[keyValue.key] !== undefined 
          ? existingVars[keyValue.key]
          : keyValue.value

        // Format the value with quotes if needed
        const needsQuotes = value.includes(' ') || value.includes('#') || 
                          value.includes('"') || value.includes("'") ||
                          value.startsWith(' ') || value.endsWith(' ')
        
        if (needsQuotes && !value.startsWith('"') && !value.startsWith("'")) {
          mergedEnv.push(`${keyValue.key}="${value}"`)
        } else {
          mergedEnv.push(`${keyValue.key}=${value}`)
        }
      }

      // Add extra variables
      const extraVars = Object.entries(existingVars)
        .filter(([key]) => !processedKeys.has(key))
      
      if (extraVars.length > 0) {
        mergedEnv.push('')
        mergedEnv.push('# Additional variables from existing .env')
        for (const [key, value] of extraVars) {
          mergedEnv.push(`${key}=${value}`)
        }
      }

      const finalContent = mergedEnv.join('\n')
      
      // Verify the final content is valid
      const finalLines = finalContent.split('\n')
      const finalVars = extractEnvironmentVariablesFromFileLines(finalLines)
      
      // All variables from existing .env should be present
      for (const [key, value] of Object.entries(existingVars)) {
        expect(finalVars[key]).toBe(value)
      }
      
      // Structure from .env.example should be maintained
      expect(finalContent.split('\n').filter(l => l.startsWith('#')).length)
        .toBeGreaterThan(10) // Should have many comment lines preserved
    })
  })
})
