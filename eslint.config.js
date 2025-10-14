import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { noAnyExceptInGenerics } from './eslint/no-any-except-in-generics';
// -----------------------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -----------------------------------------------------------------------------------------
// Export the flat config array using the `typescript-eslint` helper. This automatically
// wires up the correct parser/plugin and exposes the `strictTypeChecked` preset.
// -----------------------------------------------------------------------------------------
export default defineConfig(globalIgnores(['node_modules/**', '**/dist', '**/*.js']), 
// Base JavaScript rules.
js.configs.recommended, 
// TypeScript rules - start with the recommended set and then enable the strict
// type-checked variant which performs full program-level analysis.
...tseslint.configs.recommended, ...tseslint.configs.strictTypeChecked, 
// Disable strict type checking for custom ESLint rules
{
    files: ['eslint/**/*.ts'],
    rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
    },
}, 
// Provide project-aware parsing so that the strict presets have full type info.
{
    languageOptions: {
        parserOptions: {
            projectService: true,
            tsconfigRootDir: __dirname,
        },
    },
}, 
// Prettier plugin + our opinionated overrides.
{
    plugins: {
        prettier: eslintPluginPrettier,
    },
    rules: {
        'prettier/prettier': 'error',
        'newline-before-return': 'error',
        // ----------------------------------------------------------------------
        // Existing project-specific rule tweaks
        // ----------------------------------------------------------------------
        camelcase: 'off',
        'import/prefer-default-export': 'off',
        // Align with previous configuration - soften a few rules that are too strict
        'no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-misused-promises': [
            'error',
            {
                checksVoidReturn: false,
            },
        ],
        '@typescript-eslint/no-use-before-define': [
            'error',
            {
                functions: false,
            },
        ],
        // TypeScript-specific relaxations
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
    },
}, eslintConfigPrettier, 
// Custom configs
defineConfig({
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.dts.ts'],
    plugins: {
        '@nuances': {
            rules: {
                'no-any-except-in-generics': noAnyExceptInGenerics,
            },
        },
    },
    rules: {
        '@nuances/no-any-except-in-generics': 'error',
    },
}));
