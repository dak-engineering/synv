import { describe, it, expect } from 'vitest'
import { ENV_VAR_REGEX } from './regex.js'

describe('ENV_VAR_REGEX', () => {
  it('should match valid environment variable declarations', () => {
    const validCases = [
      'KEY=value',
      'DATABASE_URL=postgresql://localhost:5432/mydb',
      'API_KEY=abc123',
      'PORT=3000',
      'DEBUG=true',
      'EMPTY_VALUE=',
      'WITH_SPACES=value with spaces',
      'WITH_EQUALS=value=with=equals',
      'NUMBERS123=456',
      'UNDERSCORE_KEY=value',
      'KEY_WITH_123_NUMBERS=value',
    ]

    validCases.forEach(testCase => {
      const match = testCase.match(ENV_VAR_REGEX)
      expect(match).toBeTruthy()
      expect(match?.[0]).toBe(testCase)
    })
  })

  it('should capture key and value groups correctly', () => {
    const testCases = [
      { input: 'KEY=value', expectedKey: 'KEY', expectedValue: 'value' },
      { input: 'DATABASE_URL=postgresql://localhost', expectedKey: 'DATABASE_URL', expectedValue: 'postgresql://localhost' },
      { input: 'EMPTY=', expectedKey: 'EMPTY', expectedValue: '' },
      { input: 'WITH_SPACES=value with spaces', expectedKey: 'WITH_SPACES', expectedValue: 'value with spaces' },
    ]

    testCases.forEach(({ input, expectedKey, expectedValue }) => {
      const match = input.match(ENV_VAR_REGEX)
      expect(match?.[1]).toBe(expectedKey)
      expect(match?.[2]).toBe(expectedValue)
    })
  })

  it('should not match invalid environment variable declarations', () => {
    const invalidCases = [
      '=value',  // No key
      'KEY',     // No equals sign
      ' KEY=value',  // Leading space
      'key-with-dash=value',  // Dash in key
      'key.with.dot=value',   // Dot in key
      '123KEY=value',  // Starting with number
      'KEY =value',    // Space before equals
      '#COMMENT=value',  // Comment line
      '',  // Empty line
      '   ',  // Whitespace only
    ]

    invalidCases.forEach(testCase => {
      const match = testCase.match(ENV_VAR_REGEX)
      expect(match).toBeFalsy()
    })
  })

  it('should match environment variables with special characters in values', () => {
    const specialValueCases = [
      'KEY="quoted value"',
      'KEY=\'single quoted\'',
      'KEY=value#with#hashes',
      'KEY=value@with!special$chars',
      'KEY=http://example.com?query=param&other=value',
      'KEY=${OTHER_VAR}',
      'KEY=value;with;semicolons',
      'KEY=value,with,commas',
    ]

    specialValueCases.forEach(testCase => {
      const match = testCase.match(ENV_VAR_REGEX)
      expect(match).toBeTruthy()
      expect(match?.[0]).toBe(testCase)
    })
  })
})
