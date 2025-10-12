import { describe, it, expect } from 'vitest'
import extractKeyValueFromString from './extract-key-value-from-string.js'

describe('extractKeyValueFromString', () => {
  describe('valid environment variable lines', () => {
    it('should extract key and value from simple declarations', () => {
      expect(extractKeyValueFromString('KEY=value')).toEqual({
        key: 'KEY',
        value: 'value'
      })
      
      expect(extractKeyValueFromString('DATABASE_URL=localhost')).toEqual({
        key: 'DATABASE_URL',
        value: 'localhost'
      })
      
      expect(extractKeyValueFromString('PORT=3000')).toEqual({
        key: 'PORT',
        value: '3000'
      })
    })

    it('should handle empty values', () => {
      expect(extractKeyValueFromString('EMPTY=')).toEqual({
        key: 'EMPTY',
        value: ''
      })
      
      expect(extractKeyValueFromString('ANOTHER_EMPTY=""')).toEqual({
        key: 'ANOTHER_EMPTY',
        value: ''
      })
    })

    it('should handle quoted values', () => {
      expect(extractKeyValueFromString('QUOTED="value with spaces"')).toEqual({
        key: 'QUOTED',
        value: 'value with spaces'
      })
      
      expect(extractKeyValueFromString("SINGLE_QUOTED='value with spaces'")).toEqual({
        key: 'SINGLE_QUOTED',
        value: 'value with spaces'
      })
    })

    it('should handle values with special characters', () => {
      expect(extractKeyValueFromString('URL=https://example.com:8080/path?query=1')).toEqual({
        key: 'URL',
        value: 'https://example.com:8080/path?query=1'
      })
      
      expect(extractKeyValueFromString('CONNECTION=user:pass@host')).toEqual({
        key: 'CONNECTION',
        value: 'user:pass@host'
      })
      
      expect(extractKeyValueFromString('PATH=/usr/local/bin:/usr/bin')).toEqual({
        key: 'PATH',
        value: '/usr/local/bin:/usr/bin'
      })
    })

    it('should handle values with equals signs', () => {
      expect(extractKeyValueFromString('EQUATION=a=b+c')).toEqual({
        key: 'EQUATION',
        value: 'a=b+c'
      })
      
      expect(extractKeyValueFromString('MULTIPLE_EQUALS=key=value=another')).toEqual({
        key: 'MULTIPLE_EQUALS',
        value: 'key=value=another'
      })
    })

    it('should handle comments in values', () => {
      expect(extractKeyValueFromString('KEY=value#comment')).toEqual({
        key: 'KEY',
        value: 'value'
      })
      
      expect(extractKeyValueFromString('KEY=value # comment')).toEqual({
        key: 'KEY',
        value: 'value'
      })
      
      expect(extractKeyValueFromString('KEY="value#notacomment"')).toEqual({
        key: 'KEY',
        value: 'value#notacomment'
      })
    })

    it('should handle environment variable references', () => {
      expect(extractKeyValueFromString('KEY=${OTHER_VAR}')).toEqual({
        key: 'KEY',
        value: '${OTHER_VAR}'
      })
      
      expect(extractKeyValueFromString('PATH=${HOME}/bin:${PATH}')).toEqual({
        key: 'PATH',
        value: '${HOME}/bin:${PATH}'
      })
    })

    it('should handle keys with numbers and underscores', () => {
      expect(extractKeyValueFromString('KEY_123=value')).toEqual({
        key: 'KEY_123',
        value: 'value'
      })
      
      expect(extractKeyValueFromString('MY_2ND_KEY=value')).toEqual({
        key: 'MY_2ND_KEY',
        value: 'value'
      })
      
      expect(extractKeyValueFromString('KEY123=value')).toEqual({
        key: 'KEY123',
        value: 'value'
      })
    })

    it('should handle whitespace in values correctly', () => {
      expect(extractKeyValueFromString('KEY=  value  ')).toEqual({
        key: 'KEY',
        value: 'value'
      })
      
      expect(extractKeyValueFromString('KEY="  value  "')).toEqual({
        key: 'KEY',
        value: '  value  '
      })
      
      expect(extractKeyValueFromString('KEY=\tvalue\t')).toEqual({
        key: 'KEY',
        value: 'value'
      })
    })
  })

  describe('invalid environment variable lines', () => {
    it('should return null for lines without equals sign', () => {
      expect(extractKeyValueFromString('KEY')).toBeNull()
      expect(extractKeyValueFromString('JUST_A_KEY')).toBeNull()
    })

    it('should return null for lines without a key', () => {
      expect(extractKeyValueFromString('=value')).toBeNull()
      expect(extractKeyValueFromString('  =value')).toBeNull()
    })

    it('should return null for comment lines', () => {
      expect(extractKeyValueFromString('#KEY=value')).toBeNull()
      expect(extractKeyValueFromString('# This is a comment')).toBeNull()
      expect(extractKeyValueFromString('  # KEY=value')).toBeNull()
    })

    it('should return null for empty lines', () => {
      expect(extractKeyValueFromString('')).toBeNull()
      expect(extractKeyValueFromString('   ')).toBeNull()
      expect(extractKeyValueFromString('\t\t')).toBeNull()
    })

    it('should return null for lines with invalid key names', () => {
      expect(extractKeyValueFromString('key-with-dash=value')).toBeNull()
      expect(extractKeyValueFromString('key.with.dot=value')).toBeNull()
      expect(extractKeyValueFromString('123KEY=value')).toBeNull()
      expect(extractKeyValueFromString('KEY WITH SPACE=value')).toBeNull()
    })

    it('should return null for lines with spaces before equals', () => {
      expect(extractKeyValueFromString('KEY =value')).toBeNull()
      expect(extractKeyValueFromString('KEY  =value')).toBeNull()
    })

    it('should return null for malformed lines', () => {
      expect(extractKeyValueFromString('not an env var')).toBeNull()
      expect(extractKeyValueFromString('this is just text')).toBeNull()
      expect(extractKeyValueFromString('KEY: value')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle very long values', () => {
      const longValue = 'a'.repeat(1000)
      expect(extractKeyValueFromString(`KEY=${longValue}`)).toEqual({
        key: 'KEY',
        value: longValue
      })
    })

    it('should handle complex real-world examples', () => {
      const dbUrl = 'postgresql://user:password@localhost:5432/dbname?sslmode=require'
      expect(extractKeyValueFromString(`DATABASE_URL="${dbUrl}"`)).toEqual({
        key: 'DATABASE_URL',
        value: dbUrl
      })

      const jsonConfig = '{"key":"value","nested":{"prop":123}}'
      expect(extractKeyValueFromString(`CONFIG='${jsonConfig}'`)).toEqual({
        key: 'CONFIG',
        value: jsonConfig
      })

      const multiPath = '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
      expect(extractKeyValueFromString(`PATH=${multiPath}`)).toEqual({
        key: 'PATH',
        value: multiPath
      })
    })

    it('should handle Base64 encoded values', () => {
      const base64 = 'SGVsbG8gV29ybGQhCg=='
      expect(extractKeyValueFromString(`SECRET_KEY=${base64}`)).toEqual({
        key: 'SECRET_KEY',
        value: base64
      })
    })

    it('should handle values with line continuations (backslash)', () => {
      // Note: .env files typically don't support line continuations,
      // but the value might contain backslashes
      expect(extractKeyValueFromString('KEY=value\\ncontinued')).toEqual({
        key: 'KEY',
        value: 'value\\ncontinued'
      })
    })
  })
})
