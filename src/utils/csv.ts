/**
 * Tiny CSV serialiser. Good enough for exporting flat records to
 * Looker Studio / Google Sheets without pulling in a dependency.
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // Quote when the cell contains a comma, quote or newline.
  if (/[",\n\r]/.test(str)) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Convert an array of flat objects into a CSV string.
 * Column order is taken from `columns` if provided, otherwise from
 * the union of keys across all rows.
 */
export function toCSV(
  rows: Record<string, unknown>[],
  columns?: string[]
): string {
  if (rows.length === 0) {
    return columns && columns.length ? columns.join(",") + "\n" : "";
  }

  const headers =
    columns && columns.length
      ? columns
      : Array.from(
          rows.reduce<Set<string>>((set, row) => {
            Object.keys(row).forEach((k) => set.add(k));
            return set;
          }, new Set<string>())
        );

  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}
