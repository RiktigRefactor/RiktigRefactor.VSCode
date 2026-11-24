import * as path from "node:path";
import {
  lineOf,
  toLspPosition,
  ProtocolPosition,
  LspPosition,
} from "./positions";

export interface ProtocolRange {
  file: string;
  start: ProtocolPosition;
  end: ProtocolPosition;
}

export interface ProtocolEdit {
  file: string;
  start: ProtocolPosition;
  end: ProtocolPosition;
  newText: string;
}

export interface ProtocolWarning {
  code: string;
  message: string;
  location?: ProtocolRange;
}

export interface ProtocolRefusalReason {
  code: string;
  message: string;
  location?: ProtocolRange;
  suggestion?: string;
}

export interface ProtocolResult {
  status: "success" | "refused" | string;
  workspaceRoot: string;
  edits?: ProtocolEdit[];
  warnings?: ProtocolWarning[];
  reasons?: ProtocolRefusalReason[];
}

export interface LspEdit {
  /** Absolute path of the file. */
  file: string;
  start: LspPosition;
  end: LspPosition;
  newText: string;
}

/** Joins a result's workspace-relative `/` path with the workspace root. */
export function absolutePathOf(workspaceRoot: string, file: string): string {
  return path.resolve(workspaceRoot, ...file.split("/"));
}

/**
 * Converts a result's edits to LSP edits. Reads each file once, through readFile, to turn scalar-value columns into UTF-16 offsets.
 */
export function toLspEdits(
  result: ProtocolResult,
  readFile: (absolutePath: string) => string,
): LspEdit[] {
  const texts = new Map<string, string>();
  const textOf = (file: string): string => {
    let text = texts.get(file);
    if (text === undefined) {
      text = readFile(file);
      texts.set(file, text);
    }
    return text;
  };

  return (result.edits ?? []).map((edit) => {
    const file = absolutePathOf(result.workspaceRoot, edit.file);
    const text = textOf(file);
    return {
      file,
      start: toLspPosition(lineOf(text, edit.start.line - 1), edit.start),
      end: toLspPosition(lineOf(text, edit.end.line - 1), edit.end),
      newText: edit.newText,
    };
  });
}

/** Describes a refusal for the user: every reason with its location and suggestion. Reason codes the extension does not know are shown as they are. */
export function describeRefusal(result: ProtocolResult): string {
  const reasons = result.reasons ?? [];
  if (reasons.length === 0) {
    return "The refactoring was refused, and the tool gave no reason.";
  }
  return reasons
    .map((reason) => {
      const where = reason.location
        ? ` (${reason.location.file}:${reason.location.start.line}:${reason.location.start.column})`
        : "";
      const suggestion = reason.suggestion ? ` ${reason.suggestion}` : "";
      return `Refused (${reason.code}): ${reason.message}${where}${suggestion}`;
    })
    .join("\n");
}
