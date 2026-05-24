import "server-only";

export type CsvParseResult = {
  errors: string[];
  headers: string[];
  rows: Array<{
    rowNumber: number;
    values: Record<string, string>;
  }>;
};

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function parseCsv(input: string): CsvParseResult {
  const errors: string[] = [];
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (inQuotes) {
      if (character === '"' && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === ",") {
      record.push(field.trim());
      field = "";
      continue;
    }

    if (character === "\n") {
      record.push(field.trim());
      records.push(record);
      field = "";
      record = [];
      continue;
    }

    if (character !== "\r") {
      field += character;
    }
  }

  if (inQuotes) {
    errors.push("CSV has an unclosed quoted field.");
  }

  if (field || record.length > 0) {
    record.push(field.trim());
    records.push(record);
  }

  const nonEmptyRecords = records.filter((row) =>
    row.some((value) => value.trim()),
  );

  if (nonEmptyRecords.length === 0) {
    return {
      errors: ["CSV is empty."],
      headers: [],
      rows: [],
    };
  }

  const headers = nonEmptyRecords[0].map(normalizeHeader);
  const duplicateHeaders = headers.filter(
    (header, index) => headers.indexOf(header) !== index,
  );

  if (duplicateHeaders.length > 0) {
    errors.push(
      `Duplicate columns: ${Array.from(new Set(duplicateHeaders)).join(", ")}.`,
    );
  }

  const rows = nonEmptyRecords.slice(1).map((recordValues, index) => {
    const values: Record<string, string> = {};

    headers.forEach((header, headerIndex) => {
      values[header] = recordValues[headerIndex]?.trim() ?? "";
    });

    return {
      rowNumber: index + 2,
      values,
    };
  });

  return {
    errors,
    headers,
    rows,
  };
}

export function getAliasedValue(
  values: Record<string, string>,
  aliases: string[],
) {
  for (const alias of aliases.map(normalizeHeader)) {
    const value = values[alias];

    if (value) {
      return value.trim();
    }
  }

  return "";
}

export function splitImportList(value: string) {
  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeDuplicateKey(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}
