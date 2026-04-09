/**
 * Word DOCX Parser for 智慧畅行研发中心季度绩效考核表
 *
 * Parses .docx files by reading the table structure from the XML,
 * extracting employee info, scores, evaluation texts, and summary row data.
 */
import AdmZip from 'adm-zip';
import xml2js from 'xml2js';

/* ────── public types ────── */

export interface ScoreDetail {
  category: string;    // 业绩结果 / 核心能力 / 态度行为
  name: string;        // 工作目标达成度, 工作计划 …
  weight: number;      // 0.20, 0.05 …
  selfScore: number;   // 自评得分
  managerScore: number; // 上级评分
}

export interface ParsedEvaluation {
  employeeInfo: {
    name: string;
    team: string;
    role: string;
    manager: string;
    period: string;
  };
  scores: ScoreDetail[];
  selfTotal: number;
  managerTotal: number;
  finalScore: number;
  rating: string;
  selfEvaluationText: string;
  managerEvaluationText: string;
}

/* ────── main parser (accepts Buffer or filePath) ────── */

export async function parseEvaluationWord(input: string | Buffer): Promise<ParsedEvaluation> {
  const zip = new AdmZip(input as any);
  const documentXml = zip.readAsText('word/document.xml');

  if (!documentXml) {
    throw new Error('Invalid DOCX format: word/document.xml not found');
  }

  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(documentXml);

  const body = result['w:document']?.['w:body'];
  if (!body) throw new Error('Cannot find document body in XML');

  // ── find the main table ──
  const tables = findNodes(body, 'w:tbl');
  if (tables.length === 0) throw new Error('No tables found in document');

  const table = tables[0]; // there's only 1 table in this template
  const rows = toArray(table['w:tr']);

  // ── Row 1 (index 1): employee info (4 cells) ──
  // ["员工姓名：", "宋扬", "所在团队：公共资源组", "现任职位/角色：配置管理员"]
  const infoRow1 = getRowTexts(rows[1]);
  const name = extractAfterColon(infoRow1[0], '员工姓名') || infoRow1[1] || '';
  const team = extractAfterColon(infoRow1[2], '所在团队') || '';
  const role = extractAfterColon(infoRow1[3], '现任职位') || '';

  // ── Row 2 (index 2): manager & period ──
  // ["团队负责人姓名：龚进", "考核周期：2026-01~2026-03"]
  const infoRow2 = getRowTexts(rows[2]);
  const manager = extractAfterColon(infoRow2[0], '负责人姓名') || '';
  const period = extractAfterColon(infoRow2[1], '考核周期') || '';

  // ── Rows 6–36: score rows ──
  // Each metric occupies multiple rows (first row has the score, rest are other grade descriptions).
  // We recognize a metric row by having the score cells (columns 5 & 6) non-empty.
  const METRIC_ROWS: Array<{
    rowIndex: number;
    category: string;
    metricName: string;
    weightStr: string;
  }> = [
      { rowIndex: 6, category: '业绩结果', metricName: '工作目标达成度', weightStr: '20%' },
      { rowIndex: 10, category: '业绩结果', metricName: '工作计划', weightStr: '20%' },
      { rowIndex: 14, category: '业绩结果', metricName: '工作效率', weightStr: '20%' },
      { rowIndex: 18, category: '业绩结果', metricName: '工作质量', weightStr: '20%' },
      { rowIndex: 22, category: '核心能力', metricName: '基本职业素质', weightStr: '5%' },
      { rowIndex: 25, category: '核心能力', metricName: '专业技术能力', weightStr: '5%' },
      { rowIndex: 28, category: '态度行为', metricName: '基本行为准则', weightStr: '4%' },
      { rowIndex: 31, category: '态度行为', metricName: '团队协作性', weightStr: '3%' },
      { rowIndex: 34, category: '态度行为', metricName: '责任心', weightStr: '3%' },
    ];

  const scores: ScoreDetail[] = [];

  for (const meta of METRIC_ROWS) {
    if (meta.rowIndex >= rows.length) continue;
    const cells = getRowTexts(rows[meta.rowIndex]);
    // Cells layout: [category, metric, weight%, description, standard_score, selfScore, managerScore]
    // Due to merged cells, index positions may vary — use last two non-empty numeric cells
    const numericCells = cells.filter(c => /^\d+(\.\d+)?$/.test(c.replace(/\s/g, '')));
    // The last two numeric values in the row are selfScore and managerScore
    // But there's also the "standard score" (10/8/5/2). We need to skip it.
    // From table data: ["业绩结果 （80%）","工作 目标达成度","20%","..description..","10","9","1"]
    // So columns 5,6 (0-indexed) are always selfScore and managerScore.
    // Let's use the cell array directly since the table has 7 columns.
    console.log(`[解析] ${meta.metricName} | cells=${JSON.stringify(cells)} | 自评原值="${cells[cells.length - 2]}" → ${parseScoreValue(cells[cells.length - 2])} | 上级原值="${cells[cells.length - 1]}" → ${parseScoreValue(cells[cells.length - 1])}`);
    const selfScore = parseScoreValue(cells[cells.length - 2]);
    const managerScore = parseScoreValue(cells[cells.length - 1]);
    const weight = parseFloat(meta.weightStr) / 100;

    scores.push({
      category: meta.category,
      name: meta.metricName,
      weight,
      selfScore,
      managerScore,
    });
  }

  // ── Row 37 (summary row): ──
  // ["季度考核评级", "C", "综合考评得分", "45", "评分小计", "45", "45"]
  const summaryRow = getRowTexts(rows[37] || rows[rows.length - 4]);
  console.log(`[解析] 汇总行 | cells=${JSON.stringify(summaryRow)}`);
  let rating = '';
  let finalScore = 0;
  let selfTotal = 0;
  let managerTotal = 0;

  // Parse summary row by scanning for known labels
  for (let i = 0; i < summaryRow.length; i++) {
    const text = summaryRow[i].trim();
    if (text.includes('季度考核评级') && i + 1 < summaryRow.length) {
      rating = summaryRow[i + 1].trim();
    }
    if (text.includes('综合考评得分') && i + 1 < summaryRow.length) {
      finalScore = parseFloat(summaryRow[i + 1].replace(/\s/g, '')) || 0;
    }
    if (text.includes('评分小计') && i + 2 < summaryRow.length) {
      selfTotal = parseFloat(summaryRow[i + 1].replace(/\s/g, '')) || 0;
      managerTotal = parseFloat(summaryRow[i + 2].replace(/\s/g, '')) || 0;
    }
  }
  console.log(`[解析] 汇总结果 | 自评小计=${selfTotal} | 上级评分小计=${managerTotal} | 综合考评得分=${finalScore} | 评级=${rating}`);

  // ── Row 39 & 40: evaluation texts ──
  const selfEvalRow = getRowTexts(rows[39] || rows[rows.length - 2]);
  const managerEvalRow = getRowTexts(rows[40] || rows[rows.length - 1]);

  const selfEvaluationText = selfEvalRow.find(t => !t.includes('员工自评') && t.length > 2) || '';
  const managerEvaluationText = managerEvalRow.find(t => !t.includes('上级评价') && t.length > 2) || '';

  return {
    employeeInfo: {
      name: name.trim(),
      team: team.trim(),
      role: role.trim(),
      manager: manager.trim(),
      period: period.trim(),
    },
    scores,
    selfTotal,
    managerTotal,
    finalScore,
    rating,
    selfEvaluationText: selfEvaluationText.trim(),
    managerEvaluationText: managerEvaluationText.trim(),
  };
}

/* ────── helpers ────── */

/** Parse a score cell value; handles empty / non-numeric gracefully.
 *  Strips all internal whitespace first — Word XML sometimes splits a
 *  multi-digit number across separate <w:t> nodes, causing "4 5" instead of "45". */
function parseScoreValue(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/\s/g, '');  // remove ALL whitespace (spaces, tabs, etc.)
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Extract value portion after a colon in a label like "所在团队：公共资源组" */
function extractAfterColon(cellText: string | undefined, keyword: string): string {
  if (!cellText) return '';
  // Handle both ： (full-width) and : (half-width)
  const text = cellText.replace(/：/g, ':');
  const idx = text.indexOf(':');
  if (idx !== -1) {
    return text.substring(idx + 1).trim();
  }
  // If no colon, treat the whole cell as the value
  return text.replace(keyword, '').trim();
}

/** Recursively find all nodes with a given key in a tree  */
function findNodes(node: any, key: string): any[] {
  const found: any[] = [];
  if (!node || typeof node !== 'object') return found;
  if (node[key]) {
    const items = Array.isArray(node[key]) ? node[key] : [node[key]];
    found.push(...items);
  }
  for (const k in node) {
    if (k === key) continue;
    const val = node[k];
    if (Array.isArray(val)) {
      val.forEach((child: any) => found.push(...findNodes(child, key)));
    } else if (typeof val === 'object') {
      found.push(...findNodes(val, key));
    }
  }
  return found;
}

/** Get all text content from each cell in a table row, returns string[] */
function getRowTexts(row: any): string[] {
  if (!row) return [];
  const cells = toArray(row['w:tc']);
  return cells.map((cell: any) => extractAllText(cell).join(' ').trim());
}

/** Recursively extract all w:t text from a node */
function extractAllText(node: any): string[] {
  const texts: string[] = [];
  if (!node) return texts;
  if (node['w:t']) {
    const t = typeof node['w:t'] === 'string' ? node['w:t'] : node['w:t']._ || '';
    if (t) texts.push(t);
  }
  if (typeof node === 'object') {
    for (const k in node) {
      const val = node[k];
      if (Array.isArray(val)) {
        val.forEach((child: any) => texts.push(...extractAllText(child)));
      } else if (typeof val === 'object') {
        texts.push(...extractAllText(val));
      }
    }
  }
  return texts;
}

/** Ensure a value is always an array */
function toArray(v: any): any[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
