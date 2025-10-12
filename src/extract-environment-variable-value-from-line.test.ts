import { describe, it, expect } from 'vitest'
import extractEnvironmentVariableValueFromLine from './extract-environment-variable-value-from-line.js'

describe('extractEnvironmentVariableValueFromLine', () => {
  describe('basic values', () => {
    it('should extract simple unquoted values', () => {
      expect(extractEnvironmentVariableValueFromLine('value')).toBe('value')
      expect(extractEnvironmentVariableValueFromLine('123')).toBe('123')
      expect(extractEnvironmentVariableValueFromLine('true')).toBe('true')
      expect(extractEnvironmentVariableValueFromLine('localhost:3000')).toBe('localhost:3000')
    })

    it('should handle empty values', () => {
      expect(extractEnvironmentVariableValueFromLine('')).toBe('')
      expect(extractEnvironmentVariableValueFromLine('   ')).toBe('')
    })

    it('should trim whitespace from unquoted values', () => {
      expect(extractEnvironmentVariableValueFromLine('  value  ')).toBe('value')
      expect(extractEnvironmentVariableValueFromLine('\tvalue\t')).toBe('value')
    })
  })

  describe('quoted values', () => {
    it('should extract double-quoted values', () => {
      expect(extractEnvironmentVariableValueFromLine('"quoted value"')).toBe('quoted value')
      expect(extractEnvironmentVariableValueFromLine('"value with spaces"')).toBe('value with spaces')
      expect(extractEnvironmentVariableValueFromLine('""')).toBe('')
    })

    it('should extract single-quoted values', () => {
      expect(extractEnvironmentVariableValueFromLine("'quoted value'")).toBe('quoted value')
      expect(extractEnvironmentVariableValueFromLine("'value with spaces'")).toBe('value with spaces')
      expect(extractEnvironmentVariableValueFromLine("''")).toBe('')
    })

    it('should preserve spaces inside quotes', () => {
      expect(extractEnvironmentVariableValueFromLine('"  spaced  "')).toBe('  spaced  ')
      expect(extractEnvironmentVariableValueFromLine("'  spaced  '")).toBe('  spaced  ')
    })

    it('should handle quotes within different quote types', () => {
      expect(extractEnvironmentVariableValueFromLine('"value with \'single\' quotes"')).toBe("value with 'single' quotes")
      expect(extractEnvironmentVariableValueFromLine("'value with \"double\" quotes'")).toBe('value with "double" quotes')
    })

    it('should handle unclosed quotes by including them in the value', () => {
      expect(extractEnvironmentVariableValueFromLine('"unclosed')).toBe('"unclosed')
      expect(extractEnvironmentVariableValueFromLine("'unclosed")).toBe("'unclosed")
    })
  })

  describe('comments handling', () => {
    it('should stop at # when not inside quotes', () => {
      expect(extractEnvironmentVariableValueFromLine('value#comment')).toBe('value')
      expect(extractEnvironmentVariableValueFromLine('value # comment')).toBe('value')
      expect(extractEnvironmentVariableValueFromLine('value  #  comment')).toBe('value')
    })

    it('should preserve # inside quoted values', () => {
      expect(extractEnvironmentVariableValueFromLine('"value#hash"')).toBe('value#hash')
      expect(extractEnvironmentVariableValueFromLine("'value#hash'")).toBe('value#hash')
      expect(extractEnvironmentVariableValueFromLine('"#hashtag"')).toBe('#hashtag')
    })

    it('should handle # after closing quotes', () => {
      expect(extractEnvironmentVariableValueFromLine('"value"#comment')).toBe('value')
      expect(extractEnvironmentVariableValueFromLine("'value'#comment")).toBe('value')
      expect(extractEnvironmentVariableValueFromLine('"value" #comment')).toBe('value')
    })

    it('should handle just a comment', () => {
      expect(extractEnvironmentVariableValueFromLine('#comment')).toBe('')
      expect(extractEnvironmentVariableValueFromLine('  #comment')).toBe('')
    })
  })

  describe('special characters and edge cases', () => {
    it('should handle URLs', () => {
      expect(extractEnvironmentVariableValueFromLine('https://example.com')).toBe('https://example.com')
      expect(extractEnvironmentVariableValueFromLine('"https://example.com/path?query=1"')).toBe('https://example.com/path?query=1')
    })

    it('should handle database connection strings', () => {
      const dbUrl = 'postgresql://user:pass@localhost:5432/dbname'
      expect(extractEnvironmentVariableValueFromLine(dbUrl)).toBe(dbUrl)
      expect(extractEnvironmentVariableValueFromLine(`"${dbUrl}"`)).toBe(dbUrl)
    })

    it('should handle JSON strings', () => {
      const json = '{"key":"value"}'
      expect(extractEnvironmentVariableValueFromLine(`'${json}'`)).toBe(json)
    })

    it('should handle escaped quotes (though not specially processed)', () => {
      // Note: The current implementation doesn't handle escaped quotes specially
      // This test documents the current behavior
      expect(extractEnvironmentVariableValueFromLine('\\"value\\"')).toBe('\\"value\\"')
      expect(extractEnvironmentVariableValueFromLine('"\\"nested\\""')).toBe('\\"nested\\"')
    })

    it('should handle values with equals signs', () => {
      expect(extractEnvironmentVariableValueFromLine('key=value')).toBe('key=value')
      expect(extractEnvironmentVariableValueFromLine('"key=value"')).toBe('key=value')
    })

    it('should handle environment variable references', () => {
      expect(extractEnvironmentVariableValueFromLine('${OTHER_VAR}')).toBe('${OTHER_VAR}')
      expect(extractEnvironmentVariableValueFromLine('"${OTHER_VAR}/path"')).toBe('${OTHER_VAR}/path')
    })

    it('should handle multiline-like values (though .env files are typically single-line)', () => {
      expect(extractEnvironmentVariableValueFromLine('line1\\nline2')).toBe('line1\\nline2')
      expect(extractEnvironmentVariableValueFromLine('"line1\\nline2"')).toBe('line1\\nline2')
    })
  })

  describe('whitespace edge cases', () => {
    it('should handle various whitespace combinations', () => {
      expect(extractEnvironmentVariableValueFromLine('  "value"  ')).toBe('value')
      expect(extractEnvironmentVariableValueFromLine("  'value'  ")).toBe('value')
      expect(extractEnvironmentVariableValueFromLine('  value  #comment')).toBe('value')
      expect(extractEnvironmentVariableValueFromLine('\t\tvalue\t\t')).toBe('value')
    })
  })
})
