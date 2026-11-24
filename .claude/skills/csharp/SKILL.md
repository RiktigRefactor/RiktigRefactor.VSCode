---
name: csharp
description: Use whenever writing, editing, or reviewing C# code (.cs files), including choosing language features and coding patterns.
---

# C#

## Projects

- Use the SDK pinned in `global.json` (see the dotnet-projects skill).
- Prefer `Directory.Build.props` for shared settings across the repo.
- Keep project files minimal; most settings should be in `Directory.Build.props` or analyzers.

## Strings

Prefer raw string literals (`"""..."""`, C# 11+) over `StringBuilder`, `@"..."` or `"...\n..."`

Prefer string interpolation (`$"..."`) over `StringBuilder` for simple concatenations.


## Let analyzers enforce the rules

Anything an analyzer or formatter can check belongs in configuration, not in this skill.
Every C# project enables these, usually once in `Directory.Build.props`:

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  <AnalysisLevel>latest-all</AnalysisLevel>
  <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
</PropertyGroup>
```

- Keep style and analyzer severities in a root `.editorconfig`.
- Run `dotnet format` to apply fixes, and `dotnet format --verify-no-changes` in CI (see the continuous-integration skill).
- When a rule fires, fix the code rather than suppressing the rule.
  If a suppression is truly needed, keep it as narrow as possible and add a comment saying why.

## Language features

These are not caught by analyzers:

- Use `record` types for data, and make things immutable unless they need to change.
- Model nullability honestly: if a value can be missing, make its type nullable rather than hiding it with `!`.
- Don't mark things `sealed`.
  This conflicts with analyzer CA1852, so turn it off in `.editorconfig`:

  ```ini
  [*.cs]
  # We don't seal types; see the csharp skill.
  dotnet_diagnostic.CA1852.severity = none
  ```

## Related

- For projects, solutions, SDK pinning, and tests, see the dotnet-projects skill.
- For command-line programs, see the dotnet-cli skill.
