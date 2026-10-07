import crypto from "node:crypto";
import * as XLSX from "xlsx";

export const IMPORT_MAX_BYTES = 10 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 25_000;

export type ImportMapping = {
  date?: string;
  type?: string;
  symbol?: string;
  name?: string;
  quantity?: string;
  price?: string;
  grossAmount?: string;
  fees?: string;
  taxes?: string;
  netAmount?: string;
  currency?: string;
  notes?: string;
};

export type ParsedImport = {
  headers: string[];
  rows: Record<string, string>[];
};

const normalize = (value: unknown) => String(value ?? "").trim();

export function parseImportFile(fileName: string, bytes: Buffer): ParsedImport {
  if (bytes.byteLength > IMPORT_MAX_BYTES) {
    throw new Error("Import file is larger than the 10 MB limit.");
  }

  const lower = fileName.toLowerCase();
  let rows: Record<string, string>[];

  if (lower.endsWith(".csv")) {
    const workbook = XLSX.read(bytes.toString("utf8"), { type: "string", raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }).map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalize(value)])),
    );
  } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const workbook = XLSX.read(bytes, { type: "buffer", cellDates: true, raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }).map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalize(value)])),
    );
  } else {
    throw new Error("Unsupported file type. Upload a CSV or Excel file.");
  }

  if (rows.length > IMPORT_MAX_ROWS) {
    throw new Error(`Import contains more than ${IMPORT_MAX_ROWS.toLocaleString()} rows.`);
  }

  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

const aliases: Record<keyof ImportMapping, string[]> = {
  date: ["date", "transaction date", "trade date", "activity date", "transactiondate"],
  type: ["type", "transaction type", "action", "activity", "transaction"],
  symbol: ["symbol", "ticker", "ticker symbol", "ticker/symbol"],
  name: ["name", "description", "security", "security name", "investment"],
  quantity: ["quantity", "qty", "shares", "units"],
  price: ["price", "price per share", "share price", "unit price"],
  grossAmount: ["gross amount", "gross", "amount", "trade amount", "principal"],
  fees: ["fees", "fee", "commission"],
  taxes: ["taxes", "tax", "withholding"],
  netAmount: ["net amount", "net", "proceeds", "total"],
  currency: ["currency", "ccy"],
  notes: ["notes", "memo", "comment", "comments"],
};

export function suggestMapping(headers: string[]): ImportMapping {
  const normalized = headers.map((header) => ({ header, key: header.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() }));
  const mapping: ImportMapping = {};

  for (const field of Object.keys(aliases) as (keyof ImportMapping)[]) {
    const match = normalized.find(({ key }) => aliases[field].includes(key));
    if (match) mapping[field] = match.header;
  }

  return mapping;
}

export function parseMoney(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$€£,\s]/g, "").replace(/\(([^)]+)\)/, "-$1");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseQuantity(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeTransactionType(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.toLowerCase().trim();
  if (/^(buy|bought|purchase|purchased)$/.test(v)) return "BUY";
  if (/^(sell|sold|sale)$/.test(v)) return "SELL";
  if (/^(dividend|dividend received|div)$/.test(v)) return "DIVIDEND";
  if (/^(drip|dividend reinvestment)$/.test(v)) return "DRIP";
  if (/^(interest|interest income)$/.test(v)) return "INTEREST";
  if (/^(fee|fees|commission)$/.test(v)) return "FEE";
  if (/^(tax|taxes|withholding)$/.test(v)) return "TAX";
  if (/^(deposit|contribution|contributed)$/.test(v)) return "CONTRIBUTION";
  if (/^(withdrawal|withdraw|distribution)$/.test(v)) return "WITHDRAWAL";
  if (/^(transfer in|transfer-in|incoming transfer)$/.test(v)) return "TRANSFER_IN";
  if (/^(transfer out|transfer-out|outgoing transfer)$/.test(v)) return "TRANSFER_OUT";
  if (/^(cash|cash balance)$/.test(v)) return "CASH";
  return "OTHER";
}

export function makeFingerprint(input: Record<string, unknown>): string {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}
