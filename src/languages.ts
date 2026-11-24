/** One language tool: which documents it serves, how to start its language server, and how its settings are named. */
export interface LanguageTool {
  id: string;
  displayName: string;
  languageIds: string[];
  commandSetting: string;
  workspaceSetting: string;
  /** What to tell the user when the tool can't be started. */
  installHint: string;
}

export const languageTools: LanguageTool[] = [
  {
    id: "csharp",
    displayName: "RiktigRefactor C#",
    languageIds: ["csharp"],
    commandSetting: "riktigrefactor.csharp.command",
    workspaceSetting: "riktigrefactor.csharp.workspace",
    installHint:
      "Install it with: dotnet tool install --global RiktigRefactor.CSharp.Tool",
  },
  {
    id: "cpp",
    displayName: "RiktigRefactor C++",
    languageIds: ["cpp", "c"],
    commandSetting: "riktigrefactor.cpp.command",
    workspaceSetting: "riktigrefactor.cpp.workspace",
    installHint:
      "Build riktig-cpp from the RiktigRefactor.CPP repository and set riktigrefactor.cpp.command to its path.",
  },
];

export function toolForLanguage(languageId: string): LanguageTool | undefined {
  return languageTools.find((tool) => tool.languageIds.includes(languageId));
}
