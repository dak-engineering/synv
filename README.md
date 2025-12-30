# synv

[![npm version](https://badge.fury.io/js/synv.svg)](https://badge.fury.io/js/synv)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Intelligent environment variable synchronization tool that keeps your `.env` files in sync with `.env.example` templates.

## Features

- **Smart Sync**: Automatically synchronizes environment variables from `.env.example` to `.env`
- **Preserve Values**: Maintains your existing values in `.env` while adopting the structure from `.env.example`
- **Comments & Structure**: Preserves comments and file structure from templates
- **Stray Variable Handling**: Variables in `.env` but not in `.env.example` are moved to a separate section at the bottom
- **Interactive Mode**: User-friendly prompts for missing or conflicting variables
- **CI/CD Ready**: Non-interactive mode for automated pipelines

## Installation

```bash
# Using npm
npm install -g synv

# Using yarn
yarn global add synv

# Using bun
bun add -g synv
```

## Quick Start

```bash
# Basic usage - syncs .env.example to .env
synv

# Specify custom file paths
synv -i .env.template -o .env.local
```

## Usage

### Basic Synchronization

When you run `synv` without arguments, it will:

1. Look for `.env.example` in your current directory
2. Look for or create `.env` in your current directory
3. Synchronize variables using the structure from `.env.example`
4. Preserve your existing values from `.env`
5. Move any "stray" variables (in `.env` but not in `.env.example`) to a separate section at the bottom
6. In interactive mode, prompt you for values of new empty variables

### Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--env-example-file <path>` | `-i` | Path to the example environment file (default: `.env.example`) |
| `--env-file <path>` | `-o` | Path to the environment file (default: `.env`) |
| `--help` | | Show help information |
| `--version` | | Show version number |

### Examples

#### Sync with custom file names
```bash
synv -i .env.template -o .env.local
```

#### Use in CI/CD pipelines
```bash
# Set CI environment variable to disable interactive prompts
CI=true synv
```

## How It Works

`synv` intelligently parses your environment files to:

1. **Parse Files**: Extracts key-value pairs and comments from both files
2. **Preserve Structure**: Maintains comments, blank lines, and file organization from `.env.example`
3. **Smart Merging**:
   - Follows the order and structure of `.env.example`
   - Keeps existing values from your `.env` file
   - Adds new variables from `.env.example` with their default values
   - Moves "stray" variables (in `.env` but not in `.env.example`) to a section at the bottom
4. **Interactive Prompts**: When values are missing or need updates, provides user-friendly prompts (unless `CI=true`)

### Example

Given this `.env.example`:
```bash
# App Configuration
APP_NAME="MyApp"
APP_HOST=""

# Database
DATABASE_URL=""
```

And this `.env`:
```bash
APP_HOST="localhost:3000"
DATABASE_URL="postgres://localhost/mydb"
LEGACY_VAR="old_value"
```

Running `synv` produces:
```bash
# App Configuration
APP_NAME="MyApp"
APP_HOST="localhost:3000"

# Database
DATABASE_URL="postgres://localhost/mydb"

# Additional environment variables
LEGACY_VAR="old_value"
```

### Supported Syntax

`synv` supports various environment variable formats:

```bash
# Simple variables
API_KEY=abc123
PORT=3000

# Quoted values
DATABASE_URL="postgresql://localhost:5432/db"
MESSAGE='Hello World'

# Empty variables (placeholders)
SECRET_KEY=""
UNSET_VAR=

# Variables with special characters
COMPLEX_VAR=value-with-dashes_and_underscores
URL=https://example.com/path?query=value

# Comments are preserved
# This is a section comment
API_KEY=value
```

## Development

### Prerequisites

- Node.js 18+ or Bun 1.3.0+
- TypeScript 5.8+

### Setup

```bash
# Clone the repository
git clone https://github.com/dak-engineering/synv.git
cd synv

# Install dependencies
bun install

# Run in development mode
bun dev

# Build the project
bun run build
```

### Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test:coverage

# Run tests with UI
bun test:ui

# Run tests once (for CI)
bun test:ci
```

### Project Structure

```
synv/
├── src/
│   ├── cli.ts          # CLI entry point using cmd-ts
│   ├── index.ts        # Core sync logic
│   ├── cli.test.ts     # End-to-end CLI tests
│   └── index.test.ts   # Unit tests
├── dist/               # Compiled output
├── coverage/           # Test coverage reports
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Maintain existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [cmd-ts](https://github.com/Schniz/cmd-ts) for CLI parsing
- Interactive prompts powered by [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js)
- Styled output with [chalk](https://github.com/chalk/chalk)
- Progress indicators via [ora](https://github.com/sindresorhus/ora)

---

Made with TypeScript
