# synv

[![npm version](https://badge.fury.io/js/synv.svg)](https://badge.fury.io/js/synv)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🔄 Intelligent environment variable synchronization tool that keeps your `.env` files in sync with `.env.example` templates

## ✨ Features

- **Smart Sync**: Automatically synchronizes environment variables from `.env.example` to `.env`
- **Interactive Mode**: User-friendly prompts for missing or updated variables
- **Preserve Values**: Maintains existing values in your `.env` file
- **Comments & Structure**: Preserves comments and file structure from templates
- **Automatic Backup**: Creates backups before modifying `.env` files
- **Fuzzy Search**: Intelligent file selection with fuzzy matching
- **Type Safety**: Built with TypeScript for reliability
- **Comprehensive Testing**: Full test coverage with Vitest

## 📦 Installation

```bash
# Using npm
npm install -g synv

# Using yarn
yarn global add synv

# Using bun
bun add -g synv
```

## 🚀 Quick Start

```bash
# Basic usage - syncs .env.example to .env
synv

# Specify custom file paths
synv --env-file .env.local --env-example-file .env.template

# Skip backup creation
synv --skip-backup

# Run in quiet mode (no output)
synv --quiet
```

## 📖 Usage

### Basic Synchronization

When you run `synv` without arguments, it will:

1. Look for `.env.example` in your current directory
2. Look for or create `.env` in your current directory
3. Create a backup of your existing `.env` file
4. Synchronize variables from `.env.example` to `.env`
5. Prompt you for values of new or empty variables

### Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--env-example-file <path>` | `-x` | Path to the example environment file (default: `.env.example`) |
| `--env-file <path>` | `-e` | Path to the environment file (default: `.env`) |
| `--skip-backup` | | Skip creating a backup of the .env file |
| `--quiet` | | Suppress all output |

### Examples

#### Sync with custom file names
```bash
synv -x .env.template -e .env.local
```

#### Sync without creating backup
```bash
synv --skip-backup
```

#### Use in CI/CD pipelines
```bash
synv --quiet --skip-backup
```

## 🔧 How It Works

`synv` intelligently parses your environment files to:

1. **Extract Variables**: Identifies all environment variables using advanced regex patterns
2. **Preserve Structure**: Maintains comments, empty lines, and file organization
3. **Smart Merging**: 
   - Keeps existing values from your `.env` file
   - Adds new variables from `.env.example`
   - Removes variables no longer in `.env.example`
   - Updates empty variables with example values
4. **Interactive Prompts**: When values are missing or need updates, provides user-friendly prompts

### Supported Syntax

`synv` supports various environment variable formats:

```bash
# Simple variables
API_KEY=abc123
PORT=3000

# Quoted values
DATABASE_URL="postgresql://localhost:5432/db"
MESSAGE='Hello World'

# Empty variables
SECRET_KEY=
UNSET_VAR=

# Variables with special characters
COMPLEX_VAR=value-with-dashes_and_underscores
URL=https://example.com/path?query=value

# Comments are preserved
# This is a comment
API_KEY=value # Inline comment

# Multi-line values (with quotes)
MULTI_LINE="line1
line2
line3"
```

## 🏗️ Development

### Prerequisites

- Node.js 18+ or Bun 1.3.0+
- TypeScript 5.8+

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/synv.git
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
```

### Project Structure

```
synv/
├── src/
│   ├── cli.ts                                      # Main CLI application
│   ├── extract-environment-variables-from-file-lines.ts
│   ├── extract-environment-variable-value-from-line.ts
│   ├── extract-key-value-from-string.ts
│   └── regex.ts                                    # Regex patterns for parsing
├── coverage/                                        # Test coverage reports
├── dist/                                           # Compiled output
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 🧪 Testing

The project includes comprehensive test coverage:

- Unit tests for all parsing functions
- Integration tests for complete workflows
- Edge case handling for various .env formats
- Regex pattern validation

Run the test suite:

```bash
bun test
```

## 🤝 Contributing

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

## 📝 Changelog

See [Releases](https://github.com/yourusername/synv/releases) for a detailed changelog.

## 🐛 Known Issues

- Multi-line environment values must be properly quoted
- Some edge cases with complex regex patterns in values

## 🗺️ Roadmap

- [ ] Support for `.env.local`, `.env.development`, etc.
- [ ] Configuration file support (`.synvrc`)
- [ ] Dry-run mode
- [ ] Variable validation rules
- [ ] Environment variable encryption
- [ ] Git hooks integration
- [ ] VS Code extension

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [cmd-ts](https://github.com/Schniz/cmd-ts) for CLI parsing
- Interactive prompts powered by [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js)
- Fuzzy search using [fuzzbunny](https://github.com/zackradisic/fuzzbunny)
- Styled output with [chalk](https://github.com/chalk/chalk)
- Progress indicators via [ora](https://github.com/sindresorhus/ora)

## 💬 Support

If you have any questions or run into issues, please:

1. Check the [FAQ](#) section
2. Search [existing issues](https://github.com/yourusername/synv/issues)
3. Create a new issue if needed

## 👤 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourtwitter](https://twitter.com/yourtwitter)

---

Made with ❤️ and TypeScript
