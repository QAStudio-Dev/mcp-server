# Publishing Guide

This document explains how to publish new versions of the QA Studio MCP Server to npm.

## Prerequisites

1. **NPM Account**: You need publish access to `@qastudio-dev/mcp-server`
2. **Trusted Publisher** (one-time, no rotating token):
   - Open https://www.npmjs.com/package/@qastudio-dev/mcp-server → Settings → Trusted Publisher
   - Publisher: GitHub Actions
   - Organization: `QAStudio-Dev`
   - Repository: `mcp-server`
   - Workflow filename: `publish.yml`
   - Enable **Allow npm publish**
   - Leave Environment name empty
3. **Do not set `NPM_TOKEN` / `NODE_AUTH_TOKEN`, and do not pass `registry-url` to `actions/setup-node@v4`.** That action exports a dummy `NODE_AUTH_TOKEN` which overrides OIDC and produces `E404`.

## Publishing a New Version

The project uses GitHub Actions for automated publishing. To publish a new version:

### 1. Via GitHub UI (Recommended)

1. Go to the **Actions** tab in your GitHub repository
2. Click on **"Publish to npm"** workflow
3. Click **"Run workflow"**
4. Select the version bump type:
   - **patch**: Bug fixes, minor changes (1.0.0 → 1.0.1)
   - **minor**: New features, backwards compatible (1.0.0 → 1.1.0)
   - **major**: Breaking changes (1.0.0 → 2.0.0)
5. Leave **skip_version_bump** unchecked for a new release. Check it only to republish the current `package.json` version after a failed publish (for example `v1.1.1` is already tagged).
6. Click **"Run workflow"**

The workflow will:

- Bump the version in `package.json`
- Build the TypeScript code
- Run format checks
- Commit and push the version bump
- Create a git tag
- Publish to npm
- Create a GitHub release

### 2. Manual Publishing (Not Recommended)

If you need to publish manually:

```bash
# 1. Ensure you're on main branch and up to date
git checkout main
git pull

# 2. Bump version (choose one)
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# 3. Build
npm run build

# 4. Publish
npm publish --access public

# 5. Push changes and tags
git push
git push --tags
```

## Version Guidelines

### Patch (x.x.X)

- Bug fixes
- Documentation updates
- Performance improvements
- No breaking changes

### Minor (x.X.x)

- New features
- New tools added
- Backwards compatible changes
- Deprecations (with warnings)

### Major (X.x.x)

- Breaking API changes
- Removed deprecated features
- Major architectural changes
- Changes that require user action

## Post-Publishing Checklist

After publishing a new version:

- [ ] Verify package on npm: https://www.npmjs.com/package/@qastudio-dev/mcp-server
- [ ] Test installation: `npx @qastudio-dev/mcp-server@latest`
- [ ] Update documentation if needed
- [ ] Announce in relevant channels (Discord, Slack, etc.)
- [ ] Close related GitHub issues/PRs

## Troubleshooting

### "401 Unauthorized" or "404 Not Found" on publish

- Confirm the Trusted Publisher matches this repo and `publish.yml`
- Confirm **Allow npm publish** is enabled
- Confirm the workflow does not set `NODE_AUTH_TOKEN`
- Confirm the job uses Node 22.14+ / npm 11.5.1+ on a GitHub-hosted runner

### "Package already exists"

- Version wasn't bumped correctly
- Check `package.json` version number
- Verify the version doesn't exist on npm

### "Build failed"

- Fix TypeScript compilation errors
- Fix format issues: `npm run format`
- Test locally: `npm run build`

### "Permission denied"

- Verify npm token has publish access
- Check you're a member of the `@qastudio-dev` organization

## First Time Setup

If this is the first time publishing:

1. **Create npm organization** (if not exists):

   ```bash
   npm org create qastudio-dev
   ```

2. **Add collaborators**:
   - Go to https://www.npmjs.com/settings/qastudio-dev/members
   - Invite team members with appropriate roles

3. **Add a Trusted Publisher** as described in Prerequisites. Do not create a classic or granular write token for CI.

4. **Verify package name is available**:
   ```bash
   npm view @qastudio-dev/mcp-server
   # Should return "npm ERR! code E404" if available
   ```

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
