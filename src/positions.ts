/** Protocol positions are 1-based and count Unicode scalar values; LSP and VS Code positions are 0-based and count UTF-16 code units. */

export interface ProtocolPosition {
  line: number;
  column: number;
}

export interface LspPosition {
  line: number;
  character: number;
}

/** Converts an LSP position, given the text of its line, to a protocol position. */
export function toProtocolPosition(lineText: string, position: LspPosition): ProtocolPosition {
  const scalarsBefore = Array.from(lineText.slice(0, position.character)).length;
  return { line: position.line + 1, column: scalarsBefore + 1 };
}

/** Converts a protocol position to an LSP position, given the text of its line. Throws when the column is past the end of the line. */
export function toLspPosition(lineText: string, position: ProtocolPosition): LspPosition {
  let character = 0;
  let scalars = 1;
  while (scalars < position.column) {
    if (character >= lineText.length) {
      throw new RangeError(`Column ${position.column} is past the end of line ${position.line}.`);
    }
    const codePoint = lineText.codePointAt(character)!;
    character += codePoint > 0xffff ? 2 : 1;
    scalars++;
  }
  return { line: position.line - 1, character };
}

/** Returns the text of a zero-based line, without its line break. */
export function lineOf(text: string, line: number): string {
  const lines = text.split(/\r\n|\r|\n/);
  if (line < 0 || line >= lines.length) {
    throw new RangeError(`Line ${line + 1} is past the end of the file.`);
  }
  return lines[line];
}
