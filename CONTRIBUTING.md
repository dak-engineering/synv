# Contributing to synv

Thank you for your interest in contributing to synv! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run tests:
   ```bash
   bun test
   ```
4. Build the project:
   ```bash
   bun run build
   ```

## Making Changes

### Creating a Changeset

We use [changesets](https://github.com/changesets/changesets) to manage versions and changelogs. When you make a change that should be released, you need to create a changeset:

1. Run the changeset command:
   ```bash
   bun run changeset
   ```

2. Select the packages you want to include in the changeset (press space to select)

3. Choose the type of change:
   - **patch**: Bug fixes and minor updates (0.0.X)
   - **minor**: New features that are backward compatible (0.X.0)
   - **major**: Breaking changes (X.0.0)

4. Write a brief description of the change. This will appear in the changelog.

Example changeset file (`.changeset/fluffy-pandas-dance.md`):
```markdown
---
"synv": patch
---

Fixed environment variable parsing for quoted values
```

### Commit Messages

We follow conventional commit messages:
- `fix:` for bug fixes
- `feat:` for new features
- `docs:` for documentation changes
- `chore:` for maintenance tasks
- `ci:` for CI/CD changes

## Pull Request Process

1. Create a new branch for your changes
2. Make your changes and add tests if applicable
3. Create a changeset (see above)
4. Commit your changes including the changeset file
5. Push your branch and open a pull request
6. Wait for the CI checks to pass

## Release Process

Our release process is fully automated:

1. When PRs with changesets are merged to `main`, a "Version Packages" PR is automatically created
2. This PR updates package versions and changelogs based on the changesets
3. For non-major releases, the PR is automatically merged
4. For major releases, manual approval is required
5. After merging, packages are automatically published to npm

### Pre-release versions

You can also create pre-release versions by pushing to these branches:
- `alpha` - for alpha releases
- `beta` - for beta releases
- `rc` - for release candidates

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun run test:coverage

# Open test UI
bun run test:ui
```

## Questions?

If you have questions, please open an issue on GitHub.