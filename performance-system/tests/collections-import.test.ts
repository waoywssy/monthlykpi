import test from 'node:test';
import assert from 'node:assert/strict';

import * as xlsx from 'xlsx';

import { parseCollectionsWorkbook } from '@/lib/collections/import';

test('parseCollectionsWorkbook keeps same-month same-amount collections when dates differ', () => {
  const worksheet = xlsx.utils.json_to_sheet([
    { 项目名称: '项目A', 回款金额: 1000, 回款日期: '2026-03-01', 项目分类: '平台', 备注: '第一笔' },
    { 项目名称: '项目A', 回款金额: 1000, 回款日期: '2026-03-15', 项目分类: '平台', 备注: '第二笔' },
  ]);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Q1');

  const rows = parseCollectionsWorkbook(
    xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer,
  );

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => row.date.toISOString().slice(0, 10)),
    ['2026-03-01', '2026-03-15'],
  );
});

test('parseCollectionsWorkbook rejects invalid dates instead of silently using today', () => {
  const worksheet = xlsx.utils.json_to_sheet([
    { 项目名称: '项目A', 回款金额: 1000, 回款日期: 'not-a-date', 项目分类: '平台' },
  ]);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Q1');

  assert.throws(
    () =>
      parseCollectionsWorkbook(
        xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer,
      ),
    /回款日期无效/,
  );
});
