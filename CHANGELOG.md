# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-01

### Added

- Initial release of Kiro Doc Sync
- Cross-platform CLI tool for syncing documentation files
- Git sparse-checkout support for efficient file syncing
- Pattern-based file selection
- Interactive mode for file conflict resolution
- Configurable file override behavior
- Support for multiple Git repositories
- Comprehensive error handling
- English and Chinese documentation
- GitHub Actions workflows for testing and publishing

### Features

- Shallow clone with `--depth 1` for faster syncing
- Automatic `.kiro/steering/` directory creation
- Temporary file cleanup
- Clear console output with status indicators
- Command-line options for custom config and project paths
- Help and version commands

## [Unreleased]

### Planned

- Add support for authentication tokens
- Add dry-run mode
- Add file filtering by extension
- Add progress indicators for large syncs
