# Plan: RiktigRefactor VS Code extension

Source: [RiktigRefactor.Spec](https://github.com/RiktigRefactor/RiktigRefactor.Spec) (`interfaces.md`, `protocol.md`, `principles.md`, `limitations.md`, `process.md`, `test-format.md`).

## Decisions

- **LSP mapping:** standard LSP code actions plus a custom command (decided).
  - The server returns `CodeAction`s with `disabled.reason` for would-refuse refactorings.
  - Each action carries `workspace/executeCommand` arguments matching the protocol `Request`.
  - The server returns a `WorkspaceEdit`, with warnings as `changeAnnotations` (`needsConfirmation: true`) so VS Code shows its refactor preview.
  - The client uses `vscode-languageclient`.
  - The server advertises each action's option schema so the client can prompt for options.
- **One extension bundles all languages.**
  - Languages: C#, Java, TypeScript and C++ today. Python is planned.
  - Rejected: one extension per language. It is more to publish and maintain, and the spec names a single extension, `riktigrefactor.vscode`.

## What the spec requires

- **Thin client.** The extension has no refactoring logic. Each language tool runs as a long-lived language server.
- **Code actions.** Each refactoring is a code action (lightbulb, Ctrl+.). Would-refuse refactorings appear disabled with the reason.
- **Single undo.** Each refactoring is one `WorkspaceEdit`, undone with one Ctrl+Z.
- **Rename.** "Riktig Rename" is a separate command. A setting lets it take over F2; the setting is off by default.
- **Six refactorings.** Rename, Extract IIFE, Move static member, Make method static, Convert to instance method, Extract object from arguments.
- **Protocol.**
  - Results are `success` (edits, warnings, commit message) or `refused` (stable reason codes).
  - Lines and columns are 1-based and count Unicode scalar values.
  - VS Code positions are 0-based and count UTF-16 units, so the extension must convert.
  - Result file paths are relative to `workspaceRoot` and use `/`.
  - Clients must tolerate unknown reason codes.
- **Commit messages.** Results include an Arlo-notation commit message.
- **Packaging.** Publish `riktigrefactor.vscode` to the VS Code Marketplace.

## State of the language repos (checked 2026-11-23)

- C#, Java, TypeScript and C++ each have a CLI and a `refusal-codes.md`.
- None has a language server yet. Searches for LSP code found nothing that implements it.
- The server work lives in those repos, not here. Phase 1 defines the contract they implement.

## Bundling all languages: difficulty

Moderate. The extension side is easy. The cost is in the servers and in distribution.

- **Easy: client wiring.**
  - Use one `LanguageClient` per language, with a document selector per language.
  - The code is the same for every language. A table maps language to server command and document selector.
  - Activation events are `onLanguage:csharp`, `java`, `typescript`, `javascript`, `cpp` and `c`.
- **Medium: server discovery and install.**
  - The tools come from different ecosystems: dotnet tool, a Java jar, an npm package and a native binary.
  - Resolve each by setting, then PATH, then an offer to install it.
  - Check each tool's version at startup.
  - Don't bundle the tools in the VSIX at first. Doing so means a platform-specific VSIX per OS and architecture, and it ties the extension's release cycle to four other repos.
- **Medium: per-language preconditions.**
  - C++ needs `compile_commands.json` and refuses without it.
  - C# needs a `.sln` or `.csproj`.
  - Java needs Maven or Gradle, and a JDK.
  - TypeScript needs `tsconfig.json`.
  - The extension must detect a missing precondition and say what to do. It must not fail silently.
- **Medium: coexisting with the official language extensions.**
  - Riktig runs next to C# Dev Kit, Red Hat Java, the built-in TypeScript service and clangd.
  - Code action kinds must be distinct (`refactor.rewrite.riktig.*`) and the action titles clearly labeled, so users can tell them apart.
  - Rename must not collide with the built-in F2 rename. That is why it is a separate command.
- **Hard, but outside this repo: servers.** Each of the four repos must grow a server that implements the Phase 1 contract. The extension can't ship working features for a language until its server does.
- **Risk: resource use.** Each language server loads the whole workspace, which can be heavy for large C# and C++ solutions. Start servers lazily, per workspace folder, and add a setting to disable a language.

## Status (2026-11-23)

- Done: LSP mapping (Spec branch `lsp-mapping`), `riktig-cs lsp` (CSharp branch `language-server`), `riktig-cpp lsp` (CPP branch `language-server`, not built or run), and Riktig Rename in this extension (branch `rename-extension`).
- Tested against the real C# server end to end (protocol result to UTF-16 edits). Not yet run inside VS Code.
- Not done: the other five refactorings, disabled-with-reason code actions, Python and Java, installing tools for the user.

## Phases

1. **Spec gap, in the Spec repo first.**
   - Document the LSP mapping in `interfaces.md`: command names, code action kinds, the option-schema advertisement, the `refused` to `disabled.reason` mapping, and warnings as change annotations.
   - Document server discovery: how to start each server and report its version.
   - Open an issue in each language repo for its server.
2. **Scaffold.**
   - TypeScript extension, `esbuild` bundling, `@vscode/test-electron`.
   - CI that builds, tests and packages with `vsce`.
3. **Server lifecycle.**
   - Language table with a client per language and workspace folder.
   - Resolve the tool, check its version, show status in the status bar and an output channel.
   - Detect missing preconditions per language and explain them.
4. **Code actions and execution.**
   - Surface the server's actions, including disabled ones with their reason.
   - Prompt for options from the option schema.
   - Apply the `WorkspaceEdit` through the refactor preview as one undo step.
   - On refusal, show the reason, location and suggestion. Handle unknown codes.
5. **Rename.**
   - "Riktig Rename" command.
   - `riktigrefactor.rename.overrideF2` setting, off by default.
6. **Extras.**
   - Copy the commit message, or prefill the SCM input box.
   - Warn when the working tree mixes a refactoring with other changes.
   - Opt-in telemetry of refusal codes only, and the opt-in issue-report flow.
7. **Testing.**
   - Unit-test the position conversion: 1-based vs 0-based, and scalar values vs UTF-16.
   - Run end-to-end tests against a fake LSP server using recorded protocol results.
   - Run smoke tests against each real server once it exists.
   - Check that applying an edit gives exactly the expected output.
8. **Release.**
   - Follow `process.md`: commits to `main` produce prereleases, and the AI drafts release notes for a person to approve.
   - Publish to the Marketplace and Open VSX.

## Open items

- Python server: out of scope until its repo has a server.
- Whether to bundle the tools later, as platform-specific VSIXes, once the servers stabilize.
- The `riktigrefactor.rename.overrideF2` mechanism: a keybinding or a rename provider.
- Update the claude.ai `claude/todo.md` doc with these items (AGENTS.md says it is the only to-do list).
