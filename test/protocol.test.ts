import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { absolutePathOf, describeRefusal, toLspEdits, ProtocolResult } from '../src/protocol';

const root = path.resolve('workspace');

test('edit files are joined to the workspace root', () => {
  assert.equal(absolutePathOf(root, 'src/Foo.cs'), path.join(root, 'src', 'Foo.cs'));
});

test('edits become UTF-16 ranges, reading each file once', () => {
  const reads: string[] = [];
  const result: ProtocolResult = {
    status: 'success',
    workspaceRoot: root,
    edits: [
      { file: 'a.cpp', start: { line: 2, column: 3 }, end: { line: 2, column: 6 }, newText: 'count' },
      { file: 'a.cpp', start: { line: 1, column: 1 }, end: { line: 1, column: 4 }, newText: 'count' },
    ],
  };

  const edits = toLspEdits(result, (file) => {
    reads.push(file);
    return 'abc\n😀 xyz\n';
  });

  assert.deepEqual(reads, [path.join(root, 'a.cpp')]);
  assert.deepEqual(edits[0].start, { line: 1, character: 3 });
  assert.deepEqual(edits[0].end, { line: 1, character: 6 });
  assert.deepEqual(edits[1].start, { line: 0, character: 0 });
});

test('a refusal shows its code, message, location and suggestion', () => {
  const message = describeRefusal({
    status: 'refused',
    workspaceRoot: root,
    reasons: [
      {
        code: 'a-code-the-extension-has-never-seen',
        message: 'Nope.',
        location: { file: 'a.cs', start: { line: 3, column: 5 }, end: { line: 3, column: 9 } },
        suggestion: 'Try again.',
      },
    ],
  });
  assert.equal(message, 'Refused (a-code-the-extension-has-never-seen): Nope. (a.cs:3:5) Try again.');
});

test('a refusal with no reasons still says something', () => {
  assert.match(describeRefusal({ status: 'refused', workspaceRoot: root }), /no reason/);
});
