import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { LanguageTool, languageTools, toolForLanguage } from './languages';
import { lineOf, toProtocolPosition } from './positions';
import { describeRefusal, ProtocolResult, toLspEdits } from './protocol';

const refactorCommand = 'riktig.refactor';
const clients = new Map<string, LanguageClient>();
let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel('RiktigRefactor');
  context.subscriptions.push(
    output,
    vscode.commands.registerCommand('riktigrefactor.rename', (uri?: unknown, range?: unknown) => rename(uri, range)),
  );
  for (const document of vscode.workspace.textDocuments) {
    void ensureClient(document.languageId);
  }
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((document) => void ensureClient(document.languageId)));
}

export async function deactivate(): Promise<void> {
  await Promise.all([...clients.values()].map((client) => client.stop()));
  clients.clear();
}

async function ensureClient(languageId: string): Promise<LanguageClient | undefined> {
  const tool = toolForLanguage(languageId);
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!tool || !folder) {
    return undefined;
  }
  const existing = clients.get(tool.id);
  if (existing) {
    return existing;
  }
  const client = createClient(tool, folder);
  clients.set(tool.id, client);
  try {
    await client.start();
  } catch (error) {
    clients.delete(tool.id);
    const command = vscode.workspace.getConfiguration().get<string>(tool.commandSetting) ?? '';
    output.appendLine(`Could not start ${tool.displayName}: ${String(error)}`);
    void vscode.window.showWarningMessage(`RiktigRefactor could not start \`${command}\`. ${tool.installHint}`);
    return undefined;
  }
  return client;
}

function createClient(tool: LanguageTool, folder: vscode.WorkspaceFolder): LanguageClient {
  const configuration = vscode.workspace.getConfiguration();
  const command = configuration.get<string>(tool.commandSetting) || '';
  const configuredWorkspace = configuration.get<string>(tool.workspaceSetting) || '';
  const serverOptions: ServerOptions = {
    command,
    args: ['lsp'],
    transport: TransportKind.stdio,
    options: { cwd: folder.uri.fsPath },
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: tool.languageIds.map((language) => ({ scheme: 'file', language })),
    workspaceFolder: folder,
    outputChannel: output,
    initializationOptions: configuredWorkspace ? { workspace: path.resolve(folder.uri.fsPath, configuredWorkspace) } : undefined,
  };
  return new LanguageClient(tool.id, tool.displayName, serverOptions, clientOptions);
}

async function rename(uriArgument?: unknown, rangeArgument?: unknown): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const uri = typeof uriArgument === 'string' ? vscode.Uri.parse(uriArgument) : (editor?.document.uri);
  if (!uri) {
    return;
  }
  const document = await vscode.workspace.openTextDocument(uri);
  const position = positionOf(rangeArgument) ?? editor?.selection.start;
  if (!position) {
    return;
  }
  const client = await ensureClient(document.languageId);
  if (!client) {
    void vscode.window.showErrorMessage('RiktigRefactor has no tool for this file, or its tool could not be started. See the RiktigRefactor output.');
    return;
  }

  const wordRange = document.getWordRangeAtPosition(position);
  const newName = await vscode.window.showInputBox({
    title: 'Riktig Rename',
    prompt: 'The new name',
    value: wordRange ? document.getText(wordRange) : '',
    validateInput: (value) => (value.trim().length === 0 ? 'Enter a name.' : undefined),
  });
  if (newName === undefined) {
    return;
  }

  // The tools read files from disk, so every modified file must be saved first.
  if (!(await vscode.workspace.saveAll(false))) {
    void vscode.window.showErrorMessage('RiktigRefactor needs every modified file saved first, and some could not be saved.');
    return;
  }

  const protocolPosition = toProtocolPosition(document.lineAt(position.line).text, position);
  const result = await client.sendRequest<ProtocolResult>('workspace/executeCommand', {
    command: refactorCommand,
    arguments: [
      {
        refactoring: 'rename',
        location: { file: uri.fsPath, start: protocolPosition, end: protocolPosition },
        options: { newName },
      },
    ],
  }).catch((error: unknown) => {
    void vscode.window.showErrorMessage(`RiktigRefactor: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  });
  if (!result) {
    return;
  }
  await showResult(result);
}

function positionOf(range: unknown): vscode.Position | undefined {
  const start = (range as { start?: { line?: unknown; character?: unknown } } | undefined)?.start;
  if (typeof start?.line === 'number' && typeof start.character === 'number') {
    return new vscode.Position(start.line, start.character);
  }
  return undefined;
}

async function showResult(result: ProtocolResult): Promise<void> {
  if (result.status !== 'success') {
    const message = describeRefusal(result);
    output.appendLine(message);
    void vscode.window.showErrorMessage(message.split('\n')[0], 'Show details').then((choice) => {
      if (choice) {
        output.show();
      }
    });
    return;
  }

  const lspEdits = toLspEdits(result, (file) => fs.readFileSync(file, 'utf8'));
  const preview = vscode.workspace.getConfiguration().get<boolean>('riktigrefactor.previewBeforeApplying') ?? true;
  const edit = new vscode.WorkspaceEdit();
  for (const lspEdit of lspEdits) {
    const range = new vscode.Range(lspEdit.start.line, lspEdit.start.character, lspEdit.end.line, lspEdit.end.character);
    edit.replace(vscode.Uri.file(lspEdit.file), range, lspEdit.newText, {
      label: 'Riktig Rename',
      needsConfirmation: preview,
    });
  }
  for (const warning of result.warnings ?? []) {
    output.appendLine(`Warning (${warning.code}): ${warning.message}`);
  }
  if (!(await vscode.workspace.applyEdit(edit, { isRefactoring: true }))) {
    void vscode.window.showWarningMessage('The rename was not applied.');
  }
}

export { languageTools, lineOf };
