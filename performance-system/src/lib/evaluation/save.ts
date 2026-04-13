import { calculateScoreFromScoreItems } from './engine';

export interface EvaluationSaveEmployeeInfo {
  name: string;
  team: string;
  role: string;
  manager: string;
  period: string;
}

export interface EvaluationSaveScoreItem {
  category: string;
  name: string;
  weight: number;
  selfScore: number;
  managerScore: number;
}

export interface EvaluationSavePayload {
  employeeInfo?: Partial<EvaluationSaveEmployeeInfo>;
  scores?: Array<Partial<EvaluationSaveScoreItem>>;
  selfEvaluationText?: string | null;
  managerEvaluationText?: string | null;
}

export interface PreparedEvaluationRecord {
  employeeInfo: EvaluationSaveEmployeeInfo;
  scores: EvaluationSaveScoreItem[];
  selfEvaluationText: string | null;
  managerEvaluationText: string | null;
  selfTotal: number;
  managerTotal: number;
  finalScore: number;
  rating: string;
}

export function prepareEvaluationForSave(
  payload: EvaluationSavePayload,
): PreparedEvaluationRecord {
  const employeeInfo = normalizeEmployeeInfo(payload.employeeInfo);

  if (!employeeInfo.name || !employeeInfo.period) {
    throw new Error('缺少员工姓名或考核周期');
  }

  const scores = normalizeScores(payload.scores);
  if (scores.length === 0) {
    throw new Error('缺少评分明细');
  }

  const calculated = calculateScoreFromScoreItems(scores);

  return {
    employeeInfo,
    scores,
    selfEvaluationText: normalizeNullableText(payload.selfEvaluationText),
    managerEvaluationText: normalizeNullableText(payload.managerEvaluationText),
    ...calculated,
  };
}

function normalizeEmployeeInfo(
  employeeInfo: EvaluationSavePayload['employeeInfo'],
): EvaluationSaveEmployeeInfo {
  return {
    name: normalizeText(employeeInfo?.name),
    team: normalizeText(employeeInfo?.team),
    role: normalizeText(employeeInfo?.role),
    manager: normalizeText(employeeInfo?.manager),
    period: normalizeText(employeeInfo?.period),
  };
}

function normalizeScores(
  scores: EvaluationSavePayload['scores'],
): EvaluationSaveScoreItem[] {
  if (!Array.isArray(scores)) {
    return [];
  }

  return scores.map((score, index) => {
    const category = normalizeText(score.category);
    const name = normalizeText(score.name);

    if (!category || !name) {
      throw new Error(`第 ${index + 1} 条评分缺少指标信息`);
    }

    return {
      category,
      name,
      weight: normalizeNumber(score.weight, `第 ${index + 1} 条评分权重无效`),
      selfScore: normalizeNumber(score.selfScore, `第 ${index + 1} 条自评分无效`),
      managerScore: normalizeNumber(score.managerScore, `第 ${index + 1} 条上级评分无效`),
    };
  });
}

function normalizeNumber(value: unknown, errorMessage: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error(errorMessage);
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}
