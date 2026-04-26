import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('toCsv', () => {
  it('emits a UTF-8 BOM as the first character', () => {
    const csv = toCsv([], [{ key: 'a', header: 'A' }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('emits headers and rows', () => {
    const csv = toCsv(
      [
        { id: 'A1', name: 'alpha' },
        { id: 'B2', name: 'beta' },
      ],
      [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ]
    );
    const body = csv.replace('﻿', '');
    expect(body).toBe('ID,Name\nA1,alpha\nB2,beta');
  });

  it('escapes commas, quotes and newlines', () => {
    const csv = toCsv(
      [{ a: 'hello, world', b: 'she said "hi"', c: 'line1\nline2' }],
      [
        { key: 'a', header: 'a' },
        { key: 'b', header: 'b' },
        { key: 'c', header: 'c' },
      ]
    );
    const lines = csv.replace('﻿', '').split('\n');
    expect(lines[0]).toBe('a,b,c');
    expect(lines[1]).toContain('"hello, world"');
    expect(lines[1]).toContain('"she said ""hi"""');
    expect(csv).toContain('"line1\nline2"');
  });

  it('renders Arabic content unchanged', () => {
    const csv = toCsv([{ name: 'لجنة الجيودسي' }], [{ key: 'name', header: 'الاسم' }]);
    expect(csv).toContain('الاسم');
    expect(csv).toContain('لجنة الجيودسي');
  });

  it('handles null and undefined as empty', () => {
    const csv = toCsv(
      [{ a: null as unknown as string, b: undefined as unknown as string, c: 0 }],
      [
        { key: 'a', header: 'a' },
        { key: 'b', header: 'b' },
        { key: 'c', header: 'c' },
      ]
    );
    expect(csv.replace('﻿', '').split('\n')[1]).toBe(',,0');
  });
});

describe('parseCsv', () => {
  it('parses a simple file', () => {
    const rows = parseCsv('id,name\nA1,alpha\nB2,beta');
    expect(rows).toEqual([
      { id: 'A1', name: 'alpha' },
      { id: 'B2', name: 'beta' },
    ]);
  });

  it('parses quoted cells with commas, quotes and newlines', () => {
    const csv = 'a,b,c\n"hello, world","she said ""hi""","line1\nline2"';
    const rows = parseCsv(csv);
    expect(rows[0].a).toBe('hello, world');
    expect(rows[0].b).toBe('she said "hi"');
    expect(rows[0].c).toBe('line1\nline2');
  });

  it('strips a UTF-8 BOM and handles CRLF', () => {
    const csv = '﻿id,name\r\nA1,alpha\r\nB2,beta\r\n';
    expect(parseCsv(csv)).toEqual([
      { id: 'A1', name: 'alpha' },
      { id: 'B2', name: 'beta' },
    ]);
  });

  it('round-trips through toCsv', () => {
    const data = [
      { id: 'A1', name: 'لجنة, الجيودسي', notes: 'متعدد\nأسطر' },
      { id: 'B2', name: 'simple', notes: '' },
    ];
    const cols = [
      { key: 'id' as const, header: 'id' },
      { key: 'name' as const, header: 'name' },
      { key: 'notes' as const, header: 'notes' },
    ];
    const csv = toCsv(data, cols);
    const parsed = parseCsv(csv);
    expect(parsed).toEqual(data);
  });
});
