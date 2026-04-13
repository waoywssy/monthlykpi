import * as xlsx from 'xlsx';

export interface ParsedCollectionRow {
  projectName: string;
  projectCategory: string;
  amount: number;
  date: Date;
  period: string;
  notes: string;
}

export function parseCollectionsWorkbook(buffer: Buffer): ParsedCollectionRow[] {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const rows: ParsedCollectionRow[] = [];
  const seenFingerprints = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const headerRowIndex = findHeaderRowIndex(sheet);

    if (headerRowIndex === -1) {
      continue;
    }

    const data = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      range: headerRowIndex,
      defval: null,
    });

    data.forEach((row, rowOffset) => {
      const parsed = parseCollectionRow(row, sheetName, headerRowIndex + rowOffset + 2);
      if (!parsed) {
        return;
      }

      const fingerprint = getCollectionFingerprint(parsed);
      if (seenFingerprints.has(fingerprint)) {
        return;
      }

      seenFingerprints.add(fingerprint);
      rows.push(parsed);
    });
  }

  return rows;
}

export function getCollectionFingerprint(row: ParsedCollectionRow): string {
  return [
    row.projectName.trim().toLowerCase(),
    row.date.toISOString().slice(0, 10),
    row.amount.toFixed(2),
    row.notes.trim().toLowerCase(),
    row.projectCategory.trim().toLowerCase(),
  ].join('|');
}

function findHeaderRowIndex(sheet: xlsx.WorkSheet): number {
  const rawData = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  for (let i = 0; i < Math.min(10, rawData.length); i += 1) {
    const row = rawData[i];
    if (!Array.isArray(row)) {
      continue;
    }

    if (row.includes('项目名称') || row.includes('回款金额')) {
      return i;
    }
  }

  return -1;
}

function parseCollectionRow(
  row: Record<string, unknown>,
  sheetName: string,
  rowNumber: number,
): ParsedCollectionRow | null {
  const projectName = toTrimmedString(row['项目名称']);
  if (!projectName || projectName.includes('合计') || projectName.includes('小计')) {
    return null;
  }

  const amountValue = row['回款金额'];
  if (amountValue === null || amountValue === undefined || amountValue === '') {
    return null;
  }

  const amount = parseAmount(amountValue);
  if (!Number.isFinite(amount) || amount === 0) {
    return null;
  }

  const dateValue = row['回款日期'];
  const date = parseDate(dateValue, sheetName, rowNumber, projectName);
  const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  return {
    projectName,
    projectCategory: toTrimmedString(row['项目分类']),
    amount,
    date,
    period,
    notes:
      toTrimmedString(row['备   注']) ||
      toTrimmedString(row['备注']) ||
      toTrimmedString(row['说明']),
  };
}

function parseAmount(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value.replace(/,/g, '').trim());
  }

  return Number.NaN;
}

function parseDate(
  value: unknown,
  sheetName: string,
  rowNumber: number,
  projectName: string,
): Date {
  if (typeof value === 'number') {
    const parsed = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (Number.isNaN(parsed.getTime())) {
      throw invalidDateError(sheetName, rowNumber, projectName);
    }
    return parsed;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value.replace(/\//g, '-').trim());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  throw invalidDateError(sheetName, rowNumber, projectName);
}

function invalidDateError(sheetName: string, rowNumber: number, projectName: string) {
  return new Error(`工作表 ${sheetName} 第 ${rowNumber} 行项目“${projectName}”的回款日期无效`);
}

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
