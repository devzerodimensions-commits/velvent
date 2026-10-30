/**
 * Turning a screen into a spreadsheet.
 *
 * Done in the browser because the data is already there — asking the server to
 * build a file it has just sent would be a round trip for nothing, and on a
 * free Render instance that round trip can be a cold start.
 */

/**
 * Escapes one value for CSV.
 *
 * The leading apostrophe on anything starting with = + - or @ is deliberate.
 * Excel and Sheets treat those as formulas, so a name like "=cmd" in an export
 * becomes something a spreadsheet will try to run. Prefixing makes it text.
 */
function cell(value) {
  if (value === null || value === undefined) return '';

  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;

  // Quote anything that would otherwise break the row apart.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** `columns` is [[header, pick], …] so the order is explicit rather than key order. */
export function toCsv(rows, columns) {
  const head = columns.map(([header]) => cell(header)).join(',');
  const body = rows.map((row) => columns.map(([, pick]) => cell(pick(row))).join(','));
  // CRLF and a BOM: without them Excel opens UTF-8 as mojibake.
  return `﻿${[head, ...body].join('\r\n')}`;
}

/** Hands the file to the browser. */
export function downloadCsv(filename, rows, columns) {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "orders-2026-10-30.csv" */
export const stampedName = (base) => `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
