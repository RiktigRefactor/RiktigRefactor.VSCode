---
name: dotnet-cli
description: Use whenever creating or editing a .NET (C#/F#) command-line program, console app, or CLI, including argument parsing, options, subcommands, or help text.
---

# .NET Command-Line Programs

Use the `System.CommandLine` package for argument parsing in every .NET command-line program.
Do not hand-roll parsing of `args`, and do not use third-party parsers.

## Version

A prerelease version is fine, and preferred if it is newer than the latest stable release.
Add it with:

```shell
dotnet add package System.CommandLine --prerelease
```

The API has changed between prereleases, so check the installed version's API (and its docs) rather than relying on memory or old samples.

## Shape (as of 3.0.0-rc)

```csharp
using System.CommandLine;

var myOption = new Option<bool>("--my-option") { Description = "..." };
var myCommand = new Command("my-command", "...") { myOption };
var rootCommand = new RootCommand("name") { myCommand };
rootCommand.SetAction(_ => Run(false));
myCommand.SetAction(parseResult => Run(parseResult.GetValue(myOption)));
return rootCommand.Parse(args).Invoke();
```

In a top-level program, declare everything that local functions capture before the `return`.
Put the real work in a method that the actions call.

## Verifying

- Build the CLI project itself before you try it out. A test-only build may leave a stale exe behind, and running that exe may do real work instead of showing help.
- Check `--help` for the root command and for each subcommand.

## Guidelines

- Define options, arguments, and subcommands with `System.CommandLine` so that `--help` and error messages come for free.
- Return a meaningful exit code: 0 for success, non-zero for failure.
- Write results to stdout and diagnostics to stderr.
