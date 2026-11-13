
"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  importFidelityTransactions,
  importIcSecuritiesTransactions,
  extractIcSecuritiesPdf,
} from "./actions";

type Account = {
  id: string;
  name: string;
  currency: string;
  provider: string;
};
type Props = {
  accounts: Account[];
};

type NormalizedTransactionType =
  | "BUY"
  | "SELL"
  | "CONTRIBUTION"
  | "DIVIDEND"
  | "REINVESTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "CORE_CASH_BUY"
  | "CORE_CASH_SELL"
  | "UNKNOWN";

function detectFidelityTransactionType(
  action: unknown,
  symbol?: unknown
): NormalizedTransactionType {
  const value = String(action ?? "").trim().toUpperCase();
  const ticker = String(symbol ?? "").trim().toUpperCase();

  // Fidelity core money-market sweep activity is excluded
  // because it would otherwise double-count cash movements.
  if (ticker === "SPAXX" && value.startsWith("YOU BOUGHT")) {
    return "CORE_CASH_BUY";
  }

  if (ticker === "SPAXX" && value.startsWith("YOU SOLD")) {
    return "CORE_CASH_SELL";
  }

  if (value.startsWith("YOU BOUGHT")) return "BUY";
  if (value.startsWith("YOU SOLD")) return "SELL";
  if (value.startsWith("CASH CONTRIBUTION")) return "CONTRIBUTION";
  if (value.startsWith("DIVIDEND RECEIVED")) return "DIVIDEND";
  if (value.startsWith("REINVESTMENT")) return "REINVESTMENT";

  if (
    value.startsWith("ELECTRONIC FUNDS TRANSFER RECEIVED")
  ) {
    return "TRANSFER_IN";
  }

  if (
    value.startsWith("ELECTRONIC FUNDS TRANSFER PAID")
  ) {
    return "TRANSFER_OUT";
  }

  return "UNKNOWN";
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  let text = String(value ?? "").trim();
  if (!text) return null;

  const negative = text.startsWith("(") && text.endsWith(")");
  text = text.replace(/[,$£€\s()]/g, "");

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;

  return negative ? -Math.abs(parsed) : parsed;
}


function parseIcSecuritiesPdfText(text: string): unknown[][] {
  const headers = [
    "date",
    "description",
    "amount",
    "type",
    "symbol",
    "quantity",
    "unitPrice",
    "fees",
  ];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const transactions: unknown[][] = [];
  let current: {
    rowNumber: number;
    date: string;
    description: string;
  } | null = null;

  for (const line of lines) {
    const start = line.match(
      /^(\d+)\s+(\d{2}\/\d{2}\/\d{4})\s+(.+)$/
    );

    if (start) {
      current = {
        rowNumber: Number(start[1]),
        date: start[2],
        description: start[3],
      };
      continue;
    }

    if (!current) continue;

    current.description += ` ${line}`;

    const amounts = current.description.match(
      /([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/
    );

    if (!amounts) continue;

    const description = current.description
      .replace(/([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/, "")
      .trim();

    const credit = parseAmount(amounts[1]) ?? 0;
    const debit = parseAmount(amounts[2]) ?? 0;

    let symbol = "";
    let quantity: number | null = null;
    let unitPrice: number | null = null;
    let fees = 0;
    let amount = Math.max(credit, debit);

    const trade = description.match(
      /^(Bought|Sold)\s+([\d,]+)\s+([A-Z0-9]+)\s+at\s+([\d,.]+)\s+for a consideration of\s+([\d,.]+)\s+and total charges of\s+([\d,.]+)/i
    );

    const deposited = description.match(
      /^Deposited\s+([\d,]+)\s+of\s+([A-Z0-9]+)/i
    );

    if (trade) {
      quantity = parseAmount(trade[2]);
      symbol = trade[3].toUpperCase();
      unitPrice = parseAmount(trade[4]);
     const consideration = parseAmount(trade[5]) ?? amount;
fees = parseAmount(trade[6]) ?? 0;

amount = trade[1].toLowerCase() === "sold"
  ? Math.max(0, consideration - fees)
  : consideration;
    } else if (deposited) {
      quantity = parseAmount(deposited[1]);
      symbol = deposited[2].toUpperCase();

      // The statement's row 28 is confirmed as KASA,
      // although its extracted text says KPLC.
      if (current.rowNumber === 28) {
        symbol = "KASA";
      }

      amount = 0;
    } else {
      const ipo = description.match(
        /^New Issue\s*\/\s*IPO\s+([\d,]+)\s+of\s+([A-Z0-9]+)/i
      );

      if (ipo) {
        quantity = parseAmount(ipo[1]);
        symbol = ipo[2].toUpperCase();
      }
    }

    transactions.push([
      current.date,
      description,
      amount,
      description,
      symbol,
      quantity,
      unitPrice,
      fees,
    ]);

    current = null;
  }

  return [headers, ...transactions];
}


function getFidelityRows(rows: unknown[][]) {
  return rows.filter((row) => {
    const action = String(row[3] ?? "").trim();
    const date = String(row[0] ?? "").trim();
    const amount = parseAmount(row[12]);

    return Boolean(action && date && amount !== null);
  });
}

const fields = [
  {
    key: "date",
    label: "Transaction date",
    required: true,
    aliases: [
      "date",
      "run date",
      "trade date",
      "transaction date",
      "activity date",
      "settlement date",
    ],
  },
  {
    key: "description",
    label: "Description",
    required: true,
    aliases: [
      "description",
      "activity",
      "details",
      "memo",
      "security description",
      "transaction description",
    ],
  },
  {
    key: "amount",
    label: "Amount",
    required: true,
    aliases: [
      "amount",
      "amount ($)",
      "net amount",
      "total",
      "value",
      "transaction amount",
      "net amount usd",
      "amount usd",
    ],
  },
  {
    key: "type",
    label: "Transaction type",
    required: false,
    aliases: [
      "type",
      "action",
      "transaction type",
      "activity type",
      "transaction",
    ],
  },
  {
    key: "symbol",
    label: "Symbol / ticker",
    required: false,
    aliases: [
      "symbol",
      "ticker",
      "security symbol",
      "investment symbol",
    ],
  },
  {
    key: "quantity",
    label: "Quantity / shares",
    required: false,
    aliases: ["quantity", "shares", "units", "qty"],
  },
  {
    key: "unitPrice",
    label: "Unit price",
    required: false,
    aliases: [
      "price",
      "price ($)",
      "unit price",
      "share price",
      "price per share",
    ],
  },
  {
    key: "fees",
    label: "Fees",
    required: false,
    aliases: [
      "fees",
      "fees ($)",
      "fee",
      "commission",
      "commission ($)",
      "commissions",
    ],
  },
  {
    key: "externalId",
    label: "Transaction ID",
    required: false,
    aliases: [
      "transaction id",
      "reference number",
      "reference",
      "confirmation number",
      "id",
    ],
  },
] as const;

type FieldKey = (typeof fields)[number]["key"];
type Mapping = Record<FieldKey, string>;

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function detectMapping(headers: unknown[]): Mapping {
  const result = {} as Mapping;

  for (const field of fields) {
    const index = headers.findIndex((header) =>
      (field.aliases as readonly string[]).includes(
        normalizeHeader(header)
      )
    );

    result[field.key] = index >= 0 ? String(index) : "";
  }

  return result;
}

function isValidDate(value: unknown) {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime());
  }

  const text = String(value ?? "").trim();
  if (!text) return false;

  const parsed = new Date(text);
  return Number.isFinite(parsed.getTime());
}

export default function StatementUpload({ accounts }: Props) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");
  const [importComplete, setImportComplete] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);

  const headers = rows[0] ?? [];
  const selectedAccount = accounts.find(
  (account) => account.id === accountId
);

const isIcSecurities =
  selectedAccount?.provider === "GHANA_STOCK_EXCHANGE";

  const isFidelityStatement =
    normalizeHeader(headers[0]) === "run date" &&
    normalizeHeader(headers[3]) === "action" &&
    normalizeHeader(headers[12]) === "amount ($)";

  const dataRows = isFidelityStatement
    ? getFidelityRows(rows.slice(1))
    : rows.slice(1);

  // Fidelity CSV has a fixed structure. Its symbol is column 5
  // (zero-based index 4), regardless of the generic column mapping.
  const getFidelityType = (row: unknown[]) =>
    detectFidelityTransactionType(row[3], row[4]);

  const unknownFidelityRows = isFidelityStatement
    ? dataRows.filter(
        (row) => getFidelityType(row) === "UNKNOWN"
      ).length
    : 0;

  const skippedFidelityRows = isFidelityStatement
    ? dataRows.filter((row) => {
        const type = getFidelityType(row);

        return (
          type === "CORE_CASH_BUY" ||
          type === "CORE_CASH_SELL" ||
          (type === "REINVESTMENT" &&
            String(row[4] ?? "").trim().toUpperCase() === "SPAXX")
        );
      }).length
    : 0;

  const importableFidelityRows = isFidelityStatement
    ? dataRows.length -
      skippedFidelityRows -
      unknownFidelityRows
    : 0;

  const validation = useMemo(() => {
    if (!mapping || dataRows.length === 0) {
      return {
        valid: 0,
        invalid: 0,
        issues: [] as string[],
      };
    }

    const issues: string[] = [];
    let valid = 0;
    let invalid = 0;

    const dateIndex =
      mapping.date === "" ? -1 : Number(mapping.date);

    const amountIndex =
      mapping.amount === "" ? -1 : Number(mapping.amount);

    const descriptionIndex =
      mapping.description === ""
        ? -1
        : Number(mapping.description);

    dataRows.forEach((row, index) => {
      const rowIssues: string[] = [];

            if (isIcSecurities) {
        const description = String(
          row[descriptionIndex] ?? ""
        ).toLowerCase();

        const symbolIndex =
          mapping.symbol === "" ? -1 : Number(mapping.symbol);

        const quantityIndex =
          mapping.quantity === "" ? -1 : Number(mapping.quantity);

       const requiresShares =
        description.startsWith("bought") ||
        description.startsWith("buy") ||
        description.startsWith("new issue / ipo") ||
        description.startsWith("deposited");

      if (requiresShares) {
          if (
            symbolIndex < 0 ||
            !String(row[symbolIndex] ?? "").trim()
          ) {
            rowIssues.push("Missing stock symbol");
          }

          if (
            quantityIndex < 0 ||
            (parseAmount(row[quantityIndex]) ?? 0) <= 0
          ) {
            rowIssues.push("Missing or invalid quantity");
          }
        }
      }

      if (
        dateIndex < 0 ||
        !isValidDate(row[dateIndex])
      ) {
        rowIssues.push("Missing or invalid date");
      }

      if (
        amountIndex < 0 ||
        parseAmount(row[amountIndex]) === null
      ) {
        rowIssues.push("Missing or invalid amount");
      }

      if (
        descriptionIndex < 0 ||
        !String(row[descriptionIndex] ?? "").trim()
      ) {
        rowIssues.push("Missing description");
      }

      if (rowIssues.length > 0) {
        invalid++;

        if (issues.length < 8) {
          issues.push(
            `Row ${index + 2}: ${rowIssues.join(", ")}`
          );
        }
      } else {
        valid++;
      }
    });

    return { valid, invalid, issues };
 }, [mapping, dataRows, isIcSecurities]);

 async function handleImport() {
  const selectedAccount = accounts.find(
    (account) => account.id === accountId
  );

  const isIcSecurities =
    selectedAccount?.provider === "GHANA_STOCK_EXCHANGE";

  if (!mapping || !accountId || (!isFidelityStatement && !isIcSecurities)) {
    setError("Please select a supported statement and account.");
    return;
  }

  if (
    validation.invalid > 0 ||
    (!isIcSecurities && unknownFidelityRows > 0)
  ) {
    setError("Please resolve all invalid rows before importing.");
    return;
  }

  setImporting(true);
  setError("");
  setImportResult("");
  setImportComplete(false);

  try {
    const getValue = (row: unknown[], key: FieldKey) => {
      const index =
        mapping[key] === "" ? -1 : Number(mapping[key]);

      return index < 0 ? "" : row[index];
    };

    if (isIcSecurities) {
      const importRows = dataRows.map((row) => ({
        date: String(getValue(row, "date") ?? ""),
        action: String(
          getValue(row, "description") ||
          getValue(row, "type") ||
          ""
        ).trim(),
        symbol: String(getValue(row, "symbol") ?? "").trim(),
        description: String(
          getValue(row, "description") ?? ""
        ).trim(),
        quantity: parseAmount(getValue(row, "quantity")),
        unitPrice: parseAmount(getValue(row, "unitPrice")),
        amount: Math.abs(parseAmount(getValue(row, "amount")) ?? 0),
        fees: Math.abs(parseAmount(getValue(row, "fees")) ?? 0),
      }));

      const result = await importIcSecuritiesTransactions({
        accountId,
        fileName: file?.name ?? "IC Securities statement.csv",
        rows: importRows,
      });

      if (!result.success) {
        throw new Error(result.error || "Import failed.");
      }

      if (!("importedRows" in result)) {
        throw new Error("The import completed without returning transaction counts.");
      }

      setImportResult(
        `Import complete: ${result.importedRows} imported, ${result.skippedRows} skipped, ${result.failedRows} failed.`
      );
      setImportComplete(true);
      return;
    }

    const importRows = dataRows
      .filter((row) => {
        const type = getFidelityType(row);

        return (
          type !== "UNKNOWN" &&
          type !== "CORE_CASH_BUY" &&
          type !== "CORE_CASH_SELL" &&
          !(
            type === "REINVESTMENT" &&
            String(row[4] ?? "").trim().toUpperCase() === "SPAXX"
          )
        );
      })
      .map((row) => ({
        accountName: String(row[1] ?? "").trim(),
        date: String(row[0] ?? ""),
        action: String(row[3] ?? ""),
        symbol: String(row[4] ?? "").trim(),
        description: String(
          getValue(row, "description") || row[5] || ""
        ),
        quantity: parseAmount(row[8]),
        unitPrice: parseAmount(row[7]),
        amount: parseAmount(row[12]) ?? 0,
        fees:
          (parseAmount(row[9]) ?? 0) +
          (parseAmount(row[10]) ?? 0),
      }));

    const result = await importFidelityTransactions({
      accountId,
      fileName: file?.name ?? "Fidelity statement.csv",
      rows: importRows,
    });

    if (!result.success) {
      throw new Error(result.error || "Import failed.");
    }

    if (!("importedRows" in result)) {
      throw new Error("The import completed without returning transaction counts.");
    }

    setImportResult(
      `Import complete: ${result.importedRows} imported, ${result.skippedRows} skipped, ${result.failedRows} failed.`
    );
    setImportComplete(true);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "The import failed."
    );
  } finally {
    setImporting(false);
  }
}

   async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setRows([]);
    setMapping(null);
    setFile(null);
    setPdfText("");
    setPdfPageCount(null);
    setImportResult("");
    setImportComplete(false);

    if (!selectedFile) return;

    const extension = selectedFile.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (!["csv", "xls", "xlsx", "pdf"].includes(extension ?? "")) {
      setError("Please select a CSV, XLS, XLSX, or PDF file.");
      event.target.value = "";
      return;
    }

    if (extension === "pdf" && !isIcSecurities) {
      setError("PDF uploads are currently supported for IC Securities accounts only.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("The file is too large. Maximum file size is 10 MB.");
      event.target.value = "";
      return;
    }

    setLoading(true);

    try {
      // PDF extraction path for IC Securities.
     if (extension === "pdf") {
        const result = await extractIcSecuritiesPdf(selectedFile);

        if (!result.success) {
          throw new Error(result.error);
        }

        const extractedText = result.text ?? "";
        const parsedRows = parseIcSecuritiesPdfText(extractedText);

        if (parsedRows.length < 2) {
          throw new Error(
            "No transaction rows could be extracted from this PDF."
          );
        }

        setFile(selectedFile);
        setPdfText(extractedText);
        setPdfPageCount(result.pageCount ?? null);
        setRows(parsedRows);
        setMapping(detectMapping(parsedRows[0]));

        return;
      }

      // Existing CSV/XLS/XLSX parsing path.
      const buffer = await selectedFile.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const firstSheet =
        workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        throw new Error("No worksheet was found in this file.");
      }

      const parsedRows = XLSX.utils.sheet_to_json<unknown[]>(
        firstSheet,
        {
          header: 1,
          defval: "",
          raw: false,
        }
      );

      const nonEmptyRows = parsedRows.filter((row) =>
        row.some((cell) => String(cell).trim() !== "")
      );

      if (nonEmptyRows.length < 2) {
        throw new Error(
          "The statement must contain a header row and at least one transaction."
        );
      }

      setFile(selectedFile);
      setRows(nonEmptyRows);
      setMapping(detectMapping(nonEmptyRows[0]));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not read this statement."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateMapping(key: FieldKey, value: string) {
    setMapping((current) =>
      current ? { ...current, [key]: value } : current
    );
  }

  function clearFile() {
    setFile(null);
    setRows([]);
    setMapping(null);
    setError("");
    setImportResult("");
    setImportComplete(false);
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label
          htmlFor="investment-account"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Investment account
        </label>

        <select
          id="investment-account"
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          disabled={importing}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </select>
      </div>

      {!file ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Upload className="h-6 w-6" />
          </div>

          <span className="mt-4 text-sm font-semibold text-slate-800">
            Choose an investment statement
          </span>

          <span className="mt-1 text-xs text-slate-500">
            CSV, XLS, XLSX, or IC Securities PDF · Maximum 10 MB
          </span>

          <input
            type="file"
           accept=".csv,.xls,.xlsx,.pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={!accountId || loading}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-blue-700" />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {file.name}
              </p>

              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB ·{" "}
                {dataRows.length} rows detected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearFile}
            disabled={importing}
            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-50"
            aria-label="Remove selected file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">
          Reading your statement...
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

            {pdfText && (
        <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">
              PDF text extracted successfully
            </h3>
          </div>

          <p className="text-xs text-slate-600">
            {pdfPageCount ?? "Unknown"} pages detected. Review the extracted
            statement text below before we convert it into transactions.
          </p>

          <pre className="max-h-105 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700">
            {pdfText}
          </pre>
        </section>
      )}

      {mapping && (
        <>
          <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
            <div>
              <h3 className="font-semibold text-slate-900">
                Match your statement columns
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                We have matched common headings automatically.
                Correct any fields that were not recognized.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={`mapping-${field.key}`}
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    {field.label}

                    {field.required && (
                      <span className="ml-1 text-red-600">*</span>
                    )}
                  </label>

                  <select
                    id={`mapping-${field.key}`}
                    value={mapping[field.key]}
                    onChange={(event) =>
                      updateMapping(field.key, event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Not mapped</option>

                    {headers.map((header, index) => (
                      <option key={index} value={String(index)}>
                        {String(header || `Column ${index + 1}`)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Fields marked with * are required for this preview.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
            {isFidelityStatement && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-semibold">
                  Fidelity statement detected
                </p>

                <p className="mt-1">
                  Fidelity transaction actions have been recognized.
                  Footer and disclaimer rows are excluded from the
                  preview.
                </p>
              </div>
            )}

            {isFidelityStatement && unknownFidelityRows > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">
                  {unknownFidelityRows} unrecognized transaction
                  action(s)
                </p>

                <p className="mt-1">
                  These transactions need review before importing.
                  Unknown actions will not be imported automatically.
                </p>
              </div>
            )}

            {isFidelityStatement && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700">
                    Transactions to import
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-800">
                    {importableFidelityRows}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-700">
                    SPAXX rows to skip
                  </p>

                  <p className="mt-2 text-2xl font-bold text-amber-800">
                    {skippedFidelityRows}
                  </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-medium text-red-700">
                    Unknown actions
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-800">
                    {unknownFidelityRows}
                  </p>
                </div>
              </div>
            )}

            <h3 className="font-semibold text-slate-900">
              Validation results
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Valid rows
                  </span>
                </div>

                <p className="mt-2 text-2xl font-bold text-emerald-800">
                  {validation.valid}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Rows to review
                  </span>
                </div>

                <p className="mt-2 text-2xl font-bold text-amber-800">
                  {validation.invalid}
                </p>
              </div>
            </div>

            {validation.issues.length > 0 && (
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="mb-2 text-sm font-semibold text-amber-900">
                  Issues found
                </p>

                <ul className="space-y-1 text-xs text-amber-800">
                  {validation.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>

                {validation.invalid > validation.issues.length && (
                  <p className="mt-2 text-xs text-amber-800">
                    And {validation.invalid - validation.issues.length}{" "}
                    more rows need review.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                Transaction preview
              </h3>

              <p className="text-xs text-slate-500">
                First 10 data rows after column mapping.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-175 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3">Row</th>

                    {fields.map((field) => (
                      <th
                        key={field.key}
                        className="whitespace-nowrap px-3 py-3"
                      >
                        {field.label}
                      </th>
                    ))}

                    {isFidelityStatement && (
                      <th className="whitespace-nowrap px-3 py-3">
                        Detected type / treatment
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {dataRows.slice(0, 10).map((row, rowIndex) => {
                    const detectedType = getFidelityType(row);

                    const isSkipped =
                      detectedType === "CORE_CASH_BUY" ||
                      detectedType === "CORE_CASH_SELL" ||
                      (detectedType === "REINVESTMENT" &&
                        String(row[4] ?? "")
                          .trim()
                          .toUpperCase() === "SPAXX");

                    return (
                      <tr key={rowIndex}>
                        <td className="px-3 py-3 text-slate-400">
                          {rowIndex + 2}
                        </td>

                        {fields.map((field) => (
                          <td
                            key={field.key}
                            className="max-w-50 truncate whitespace-nowrap px-3 py-3 text-slate-700"
                          >
                            {mapping[field.key] === ""
                              ? "—"
                              : String(
                                  row[Number(mapping[field.key])] ?? "—"
                                )}
                          </td>
                        ))}

                        {isFidelityStatement && (
                          <td className="whitespace-nowrap px-3 py-3">
                            {isSkipped ? (
                              <span className="font-medium text-amber-700">
                                SKIP — SPAXX cash sweep
                              </span>
                            ) : detectedType === "UNKNOWN" ? (
                              <span className="font-medium text-red-600">
                                REVIEW — Unknown action
                              </span>
                            ) : (
                              <span className="font-medium text-emerald-700">
                                IMPORT — {detectedType}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {importResult && (
            <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              {importResult}
            </p>
          )}

         {!importComplete && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleImport}
                disabled={
                  importing ||
                  (!isFidelityStatement && !isIcSecurities) ||
                  validation.invalid > 0 ||
                  (isFidelityStatement &&
                    (unknownFidelityRows > 0 || importableFidelityRows === 0)) ||
                  (isIcSecurities && validation.valid === 0)
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing
                  ? "Importing transactions..."
                  : isIcSecurities
                    ? "Import IC Securities transactions"
                    : "Import Fidelity transactions"}
              </button>

              <p className="text-xs text-slate-500">
                {isIcSecurities
                  ? "IC Securities transactions will be imported into your Ghana Stock Exchange account. Duplicate transactions will be skipped."
                  : "Only recognized Fidelity transactions will be imported. Duplicate transactions and SPAXX sweep activity will be skipped."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
