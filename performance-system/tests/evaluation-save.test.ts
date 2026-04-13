import test from 'node:test';
import assert from 'node:assert/strict';

import { prepareEvaluationForSave } from '@/lib/evaluation/save';

test('prepareEvaluationForSave recalculates totals from score items instead of trusting client totals', () => {
  const prepared = prepareEvaluationForSave({
    employeeInfo: {
      name: '宋扬',
      team: '公共资源组',
      role: '配置',
      manager: '龚进',
      period: '2026-03',
    },
    scores: [
      {
        category: '业绩结果',
        name: '工作目标达成度',
        weight: 0.2,
        selfScore: 8,
        managerScore: 9,
      },
      {
        category: '业绩结果',
        name: '工作计划',
        weight: 0.2,
        selfScore: 7,
        managerScore: 8,
      },
    ],
    selfEvaluationText: '自评',
    managerEvaluationText: '上级评价',
  });

  assert.equal(prepared.selfTotal, 30);
  assert.equal(prepared.managerTotal, 34);
  assert.equal(prepared.finalScore, 33.2);
  assert.equal(prepared.rating, 'D');
});

test('prepareEvaluationForSave rejects empty scores', () => {
  assert.throws(
    () =>
      prepareEvaluationForSave({
        employeeInfo: {
          name: '宋扬',
          team: '公共资源组',
          role: '配置',
          manager: '龚进',
          period: '2026-03',
        },
        scores: [],
      }),
    /缺少评分明细/,
  );
});
