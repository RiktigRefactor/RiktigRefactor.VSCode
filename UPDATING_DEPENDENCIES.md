# Updating dependencies

Dependabot updates the npm packages (`package.json`, `package-lock.json`), the GitHub Actions, and the Node version in `mise.toml`.
Everything else is updated by hand.

## VS Code engine

`engines.vscode` in `package.json` and `@types/vscode` set the minimum supported VS Code version.
Dependabot may bump `@types/vscode`, but it must not be newer than `engines.vscode`; `vsce package` fails if it is.
To raise the minimum, change both together and run `./build-and-test`.

## riktig-cs and riktig-cpp

The extension calls these external tools, which are installed separately, not through this repo's dependencies.
Their versions are not pinned here.
