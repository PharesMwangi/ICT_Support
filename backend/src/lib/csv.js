// Builds CSV text that opens correctly in Excel.
// Cells starting with = + - @ are prefixed with ' so Excel will not run them as formulas.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_START.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

// rows: array of arrays. The leading ﻿ makes Excel read the file as UTF-8.
export const toCsv = (rows) => `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;
