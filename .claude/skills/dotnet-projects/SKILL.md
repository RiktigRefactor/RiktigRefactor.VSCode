---
name: dotnet-projects
description: Use whenever creating or editing a .NET (C#/F#) project or solution, adding tests to one, or choosing a test framework or SDK version.
---

# .NET Projects

## global.json

Every .NET repo has a `global.json` at the root to pin the SDK version, so everyone builds with the same SDK.
Create it with:

```shell
dotnet new globaljson --sdk-version <installed version> --roll-forward latestFeature
```

Use the installed SDK (`dotnet --version`), and check that `dotnet --version` still works afterward.

## Tests

- Use **xUnit v3** for tests: the `xunit.v3` package. Not xUnit v2 (`xunit`).
- Use **Verify** for snapshot (approval) tests: the `Verify.XunitV3` package.
  Prefer it over long hand-written assertions when checking complex output.
- Commit the `*.verified.*` files.
  Ignore the `*.received.*` files (see the gitignore skill).
- Check the installed packages' docs for the current setup, since the xUnit v3 and Verify APIs and project settings are newer and change.

## Related

- For C# code itself (language features, nullability, style, async), see the csharp skill.
- For command-line programs, see the dotnet-cli skill.
- Provide a single build-and-test entry point, per the developer-experience skill.
