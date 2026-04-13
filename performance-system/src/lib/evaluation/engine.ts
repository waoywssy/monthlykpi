import { ParsedEvaluation } from '../word/parser';

export interface ScoreInput {
  weight: number;
  selfScore: number;
  managerScore: number;
}

export interface EvaluationResult {
  selfTotal: number;
  managerTotal: number;
  finalScore: number;
  rating: string;
}

/**
 * Recalculate totals & final score from individual score items.
 *
 * Formula:
 *   - selfTotal    = Σ selfScore     (直接求和)
 *   - managerTotal = Σ managerScore  (直接求和)
 *   - finalScore   = selfTotal × 20% + managerTotal × 80%
 *
 * Rating:
 *   ≥95 → A, ≥90 → B+, ≥80 → B, ≥70 → C, <70 → D
 *
 * Bonus coefficient:
 *   A → 1.5, B+ → 1.2, B → 1.0, C → 0.8, D → 0
 */
export function calculateScore(parsed: ParsedEvaluation): EvaluationResult {
  return calculateScoreFromScoreItems(parsed.scores);
}

export function calculateScoreFromScoreItems(scores: ScoreInput[]): EvaluationResult {
  let selfTotal = 0;
  let managerTotal = 0;

  for (const s of scores) {
    selfTotal += s.selfScore * 10 * s.weight;
    managerTotal += s.managerScore * 10 * s.weight;
  }

  selfTotal = round2(selfTotal);
  managerTotal = round2(managerTotal);
  const finalScore = round2(selfTotal * 0.2 + managerTotal * 0.8);

  let rating = 'D';
  if (finalScore >= 95) rating = 'A';
  else if (finalScore >= 90) rating = 'B+';
  else if (finalScore >= 80) rating = 'B';
  else if (finalScore >= 70) rating = 'C';

  return { selfTotal, managerTotal, finalScore, rating };
}

/** Rating to bonus coefficient mapping */
export const RATING_COEFFICIENT: Record<string, number> = {
  'A': 1.5,
  'B+': 1.2,
  'B': 1.0,
  'C': 0.8,
  'D': 0,
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
