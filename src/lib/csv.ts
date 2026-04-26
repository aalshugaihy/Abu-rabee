type Cell = string | number | boolean | null | undefined;
type Row = Record<string, Cell>;

function escape(value: Cell): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Row>(rows: T[], columns: { key: keyof T; header: string }[]): string {
  const headerLine = columns.map((c) => escape(c.header)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(','));
  // Prepend BOM so Excel detects UTF-8 (important for Arabic content).
  return '﻿' + [headerLine, ...lines].join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parse a CSV string (RFC-4180-ish: handles quoted cells, embedded commas,
 * doubled-double-quote escapes, and CR/LF line endings). Returns an array of
 * rows keyed by the header row.
 */
export function parseCsv(input: string): Record<string, string>[] {
  if (!input) return [];
  // Strip BOM if present.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\n' || ch === '\r') {
        row.push(cell);
        cell = '';
        rows.push(row);
        row = [];
        // Skip the LF half of CRLF.
        if (ch === '\r' && text[i + 1] === '\n') i++;
      } else {
        cell += ch;
      }
    }
  }
  // Trailing cell / row.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // Drop fully-empty trailing rows.
  while (rows.length && rows[rows.length - 1].every((c) => c === '')) rows.pop();
  if (rows.length === 0) return [];

  const [header, ...body] = rows;
  return body.map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((key, idx) => {
      obj[key.trim()] = (cells[idx] ?? '').trim();
    });
    return obj;
  });
}
