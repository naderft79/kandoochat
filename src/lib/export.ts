// تابع تولید CSV با BOM برای فارسی در Excel

type CSVRow = Record<string, string | number | boolean | null | undefined>;

export function generateCSV(headers: { key: string; label: string }[], rows: CSVRow[]): string {
  // BOM برای پشتیبانی فارسی در Excel
  const BOM = "\uFEFF";
  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    // اگر شامل کاما یا کوتیشن یا خط جدید است، در کوتیشن قرار می دهیم
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map((h) => escapeCell(h.label)).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCell(row[h.key])).join(",")
  );

  return BOM + [headerLine, ...dataLines].join("\n");
}

export function csvToBlob(csv: string): Blob {
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
