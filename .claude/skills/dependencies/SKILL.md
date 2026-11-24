---
name: dependencies
description: Use whenever adding, removing, upgrading, or pinning a dependency (a package, library, SDK, or tool), editing a package manifest or lock file, or setting up dependency updates (e.g. Dependabot or Renovate).
---

# Dependencies

## Adding a dependency

- Add it with the package manager's own command (e.g. `dotnet add package`, `npm install`, `uv add`), not by hand-editing the manifest.
- Pick the current version instead of one remembered from training data, which is often stale.
- Check the installed version's docs for its API, rather than relying on memory.

## Pinning and lock files

- Pin versions so every build uses the same dependencies.
- Commit the lock file (e.g. `package-lock.json`, `packages.lock.json`, `uv.lock`, `Cargo.lock`).
- Pin SDK and toolchain versions too (e.g. `global.json` per the dotnet-projects skill).

## Restoring

- Build-and-test restores everything it needs, so a fresh clone works with no extra setup (see the developer-experience skill).
- Prefer repo-local tools (e.g. a `dotnet tool` manifest or npm `devDependencies`) over global installs, so two repos on the same machine don't interfere.
- Don't commit restored dependencies (e.g. `node_modules/`, `packages/`); see the gitignore skill.

## Keeping current

- Set up automated update PRs with the host's tool (e.g. Dependabot on GitHub).
   - Enable every relevant ecosystem
- CI runs on those PRs, so an update that breaks the build or tests is caught before merging (see the continuous-integration skill).
- Upgrade one dependency per commit where practical, so a breaking upgrade is easy to find and revert.
- Anything that won't be automatically updated should be documented in a file called `UPDATING_DEPENDENCIES.md`.
