# RiktigRefactor.VSCode

[![Build and test](https://github.com/RiktigRefactor/RiktigRefactor.VSCode/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/RiktigRefactor/RiktigRefactor.VSCode/actions/workflows/build-and-test.yml)
![Status: early development](https://img.shields.io/badge/status-early%20development-orange)

A VS Code extension exposing RiktigRefactor refactorings in the editor.
*Riktig* means "correct" in Swedish/Norwegian.

This is an implementation of the [RiktigRefactor specification](https://github.com/RiktigRefactor/riktigrefactor.spec).
The extension is a thin client: each language's tool runs as a language server (`riktig-cs lsp`, `riktig-cpp lsp`) and does the refactoring.
See [PLAN.md](PLAN.md) for the design.

## What works

- **Riktig Rename** for C# and C++, from the lightbulb (Ctrl+.), the editor context menu, or the command palette.
  It shows VS Code's refactor preview before applying, and applies the change as one undo step.
  When the tool refuses, you see the reason, location and suggestion.
- Set `riktigrefactor.rename.overrideF2` to use Riktig Rename on F2 in C# and C++ files.

Not yet: the other five refactorings, and showing a refactoring as disabled with its reason before you run it.

## Setup

- C#: `dotnet tool install --global RiktigRefactor.CSharp.Tool`, and open a folder that contains a `.sln`, `.slnx` or `.csproj`.
- C++: build `riktig-cpp` from [RiktigRefactor.CPP](https://github.com/RiktigRefactor/RiktigRefactor.CPP), set `riktigrefactor.cpp.command` to it, and generate `compile_commands.json` (CMake: `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`) in the folder or its `build` folder.

Modified files are saved before a refactoring runs, because the tools read files from disk.

## Building

```shell
npm install
npm test        # unit tests for position conversion and protocol results
npm run build   # bundles to dist/extension.js
```

Press F5 in VS Code to run the extension in a development host.
