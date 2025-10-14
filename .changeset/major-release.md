---
"synv": major
---

Complete rewrite of synv - a tool to sync .env files with .env.example templates.

## Breaking Changes
- Completely new implementation and behavior
- Now requires Node.js 18+ (ESM modules)

## New Features
- 🔄 Interactive conflict resolution when values differ between .env and .env.example
- 📝 Preserves formatting and comments from .env.example
- 🔤 Automatically moves stray environment variables to the bottom in alphabetical order
- 🎨 Beautiful CLI with loading spinners and colored output
- 📁 Support for custom file paths with -i and -o flags
- 🤖 CI mode support (set CI=true for non-interactive mode)
- ✨ Prompts for empty values when needed
- 🧪 Comprehensive test coverage including end-to-end CLI tests

## How it works
- .env.example is the source of truth for all environment variable keys
- Merges existing values from .env file when available
- Interactive prompts to resolve conflicts (defaults to keeping current .env values)
- Never modifies .env.example file