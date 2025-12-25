# Kiro Doc Sync

A cross-platform CLI tool to synchronize Kiro documentation files from remote Git repositories to your local project's `.kiro/steering/` directory.

## Features

- ✓ Cross-platform support (Windows, macOS, Linux)
- ✓ Sparse checkout for efficient file syncing
- ✓ Pattern-based file selection
- ✓ Interactive mode for file conflict resolution
- ✓ Configurable file override behavior
- ✓ Automatic directory creation
- ✓ Comprehensive error handling
- ✓ Temporary file cleanup

## Installation

```bash
npm install
npm run build
```

## Quick Start

1. Create a `kiro-doc-sync.cfg.json` file in your project root:

```json
{
  "general": {
    "files": {
      "sync_override": true
    }
  },
  "docs": [
    {
      "git": "https://github.com/user/repo.git",
      "steering": [
        "api/*.global.md",
        "php/di.md"
      ]
    }
  ]
}
```

2. Run the sync:

```bash
npm start
```

## Usage

### Basic Command

```bash
kiro-doc-sync
```

Syncs files based on the default `kiro-doc-sync.cfg.json` in the current directory.

### Command Options

```bash
kiro-doc-sync [options]
```

| Option | Short | Description |
|--------|-------|-------------|
| `--config <path>` | `-c` | Path to config file (default: `kiro-doc-sync.cfg.json`) |
| `--project <path>` | `-p` | Project root directory (default: current directory) |
| `--interactive` | `-i` | Ask for confirmation when files already exist |
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version |

### Examples

```bash
# Use default configuration
kiro-doc-sync

# Use custom config file
kiro-doc-sync --config ./config/sync.json

# Use custom project directory
kiro-doc-sync --project /path/to/project

# Combine options
kiro-doc-sync -c config.json -p /home/user/proj

# Interactive mode (ask before overwriting)
kiro-doc-sync --interactive

# Interactive with custom config
kiro-doc-sync -i -c ./sync.cfg.json
```

## Configuration

### Config File Format

Create `kiro-doc-sync.cfg.json` in your project root:

```json
{
  "general": {
    "files": {
      "sync_override": boolean
    }
  },
  "docs": [
    {
      "git": "string (Git repository URL)",
      "steering": [
        "string (file patterns relative to repo root)"
      ]
    }
  ]
}
```

### Configuration Options

#### `general.files.sync_override`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Controls file override behavior
  - `true`: Always overwrite existing files
  - `false`: Skip files that already exist (unless using `--interactive` mode)

#### `docs[].git`

- **Type**: `string`
- **Required**: Yes
- **Description**: Git repository URL to sync from

#### `docs[].steering`

- **Type**: `string[]`
- **Required**: Yes
- **Description**: Array of file patterns to sync from the repository (relative to repo root)

#### `docs[].branch`

- **Type**: `string`
- **Required**: No
- **Description**: Git branch to sync from (default: default branch)

#### `docs[].tag`

- **Type**: `string`
- **Required**: No
- **Description**: Git tag to sync from (takes precedence over branch)

### Example Configurations

**Simple single repository:**

```json
{
  "general": {
    "files": {
      "sync_override": true
    }
  },
  "docs": [
    {
      "git": "https://github.com/myorg/docs.git",
      "steering": ["api/reference.md", "guides/*.md"]
    }
  ]
}
```

**Multiple repositories:**

```json
{
  "general": {
    "files": {
      "sync_override": false
    }
  },
  "docs": [
    {
      "git": "https://github.com/myorg/api-docs.git",
      "steering": ["api/*.md"],
      "branch": "develop"
    },
    {
      "git": "https://github.com/myorg/guides.git",
      "steering": ["php/di.md", "patterns/*.md"],
      "tag": "v1.0.0"
    }
  ]
}
```

## How It Works

1. **Parse Configuration**: Reads `kiro-doc-sync.cfg.json` and validates settings
2. **Create Directory**: Creates `.kiro/steering/` if it doesn't exist
3. **Sparse Checkout**: For each Git repository:
   - Performs shallow clone with `--depth 1`
   - Uses Git sparse-checkout to download only specified files
   - Copies files to `.kiro/steering/`
4. **Handle Conflicts**: 
   - If `sync_override: true`, overwrites existing files
   - If `sync_override: false`:
     - Non-interactive: skips existing files
     - Interactive (`-i`): asks user for each file
5. **Cleanup**: Removes temporary cloned repositories

## Output

The tool provides clear feedback during execution:

```
Project root: /path/to/project
Config file: kiro-doc-sync.cfg.json
Found 2 doc source(s)

Loading configuration...
Cloning https://github.com/user/repo.git with sparse-checkout...
✓ Synced: api/reference.md
⊘ Skipped (exists): guides/intro.md

==================================================
Sync completed. 1 files synced, 1 errors
Synced files:
  • api/reference.md
Errors:
  • File not found in repo: docs/missing.md
==================================================
```

## Requirements

- Node.js 14+
- Git installed and available in PATH
- Read access to specified Git repositories
  - For HTTPS: username/password or personal access token
  - For SSH: SSH key configured and SSH agent running

### SSH Setup (Optional)

If using SSH URLs (e.g., `git@github.com:user/repo.git`):

**macOS/Linux:**
```bash
# Generate SSH key (if not exists)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add key to SSH agent
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub/GitLab
cat ~/.ssh/id_ed25519.pub
```

**Windows:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Start SSH agent
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent

# Add key to SSH agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519

# Add public key to GitHub/GitLab
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run compiled version
npm start
```

## Troubleshooting

### Git not found

Ensure Git is installed and available in your system PATH.

### Repository access denied

Check that you have read access to the specified Git repositories. For private repositories, ensure your Git credentials are configured.

For SSH repositories, verify:
- SSH key is generated and added to SSH agent
- Public key is added to your Git hosting service (GitHub, GitLab, etc.)
- SSH agent is running

### Files not found in repository

Verify that the file patterns in `steering` array match the actual file paths in the repository (relative to repo root).

### Permission denied on `.kiro/steering/`

Ensure you have write permissions to the project directory.

## License

MIT
