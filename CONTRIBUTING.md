# Contributing to Kiro Doc Sync

Thank you for your interest in contributing! Here's how you can help.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/kiro-doc-sync.git
cd kiro-doc-sync

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## Making Changes

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure the code builds:
   ```bash
   npm run build
   ```

3. Test your changes thoroughly

4. Commit your changes with clear messages:
   ```bash
   git commit -m "feat: add new feature" 
   ```

5. Push to your fork and create a Pull Request

## Commit Message Format

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for test changes
- `chore:` for build/dependency changes

Example:
```
feat: add support for custom steering directory
fix: handle sparse-checkout errors gracefully
docs: update README with examples
```

## Code Style

- Use TypeScript for all code
- Follow the existing code style
- Ensure `npm run build` passes without errors

## Reporting Issues

When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Your environment (OS, Node.js version, etc.)

## Pull Request Process

1. Ensure your code builds and passes all checks
2. Update documentation if needed
3. Add a clear description of your changes
4. Reference any related issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
