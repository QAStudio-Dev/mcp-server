# Contributing to QA Studio MCP Server

Thank you for considering contributing to the QA Studio MCP Server! We welcome contributions from the community.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/mcp-server.git
   cd mcp-server
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build the project**:
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. **Create a branch** for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards:
   - Use TypeScript strict mode
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests** to ensure everything works:

   ```bash
   npm test
   ```

4. **Run format check**:

   ```bash
   npm run format:check
   ```

   Or auto-format your code:

   ```bash
   npm run format
   ```

5. **Build the project** to ensure it compiles:
   ```bash
   npm run build
   ```

### Adding New Tools

When adding new MCP tools to the server:

1. Register the tool using `server.registerTool()` in `src/index.ts`
2. Define input schema using Zod with `.describe()` for each parameter
3. Implement the tool handler with proper error handling
4. Add unit tests in `src/__tests__/`
5. Update [README.md](README.md) with usage examples
6. Update [CLAUDE.md](CLAUDE.md) with technical details

Example template:

```typescript
import { z } from 'zod';

server.registerTool(
  'tool-name',
  {
    description: 'Description of what the tool does',
    inputSchema: {
      requiredParam: z.string().describe('Description of required parameter'),
      optionalParam: z.string().optional().describe('Description of optional parameter')
    }
  },
  async (args) => {
    try {
      const { requiredParam, optionalParam } = args;
      const data = await apiRequest('/endpoint');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);
```

### Testing

We use Vitest for testing. All contributions should include appropriate tests:

- **Schema tests** - Validate Zod input schemas in `src/__tests__/schemas.test.ts`
- **API tests** - Test URL construction and formatting in `src/__tests__/api.test.ts`

Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Submitting Changes

1. **Commit your changes** with a clear commit message:

   ```bash
   git add .
   git commit -m "feat: add new tool for XYZ"
   ```

   Commit message format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test additions/changes
   - `refactor:` for code refactoring
   - `chore:` for maintenance tasks

2. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request** on GitHub with:
   - Clear description of the changes
   - Reference any related issues
   - Screenshots/examples if applicable
   - Test results

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Use `type: 'text' as const` for MCP content types
- Handle errors with try-catch blocks

## License

By contributing to QA Studio MCP Server, you agree that your contributions will be licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:

- Your code will be open source
- If used in a server/service context, the source code must be made available to users
- Derivative works must also be AGPL-3.0 licensed
- You retain copyright to your contributions

See the [LICENSE](LICENSE) file for full details.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## Questions?

- Open an issue for bugs or feature requests
- Join our community discussions
- Check existing issues and PRs before creating new ones

## Related Projects

- [QA Studio](https://github.com/QAStudio-Dev/qa-studio) - Main test management platform
- [QA Studio Playwright Reporter](https://github.com/QAStudio-Dev/playwright) - Playwright integration

Thank you for contributing to QA Studio MCP Server!
