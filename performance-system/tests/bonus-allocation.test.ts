import test from 'node:test';
import assert from 'node:assert/strict';

import { allocateBonuses } from '@/lib/bonus/allocation';

test('allocateBonuses preserves the exact total pool after rounding', () => {
  const result = allocateBonuses(
    [
      {
        id: '1',
        name: 'A',
        team: 'T1',
        period: '2026Q1',
        selfTotal: 90,
        managerTotal: 95,
        finalScore: 95,
        rating: 'A',
      },
      {
        id: '2',
        name: 'B',
        team: 'T1',
        period: '2026Q1',
        selfTotal: 89,
        managerTotal: 94,
        finalScore: 94,
        rating: 'A',
      },
      {
        id: '3',
        name: 'C',
        team: 'T2',
        period: '2026Q1',
        selfTotal: 88,
        managerTotal: 93,
        finalScore: 93,
        rating: 'A',
      },
    ],
    100000
  );

  assert.equal(
    result.reduce((sum, row) => sum + row.bonus, 0),
    100000
  );
});

test('allocateBonuses returns zero allocation when total scores are non-positive', () => {
  const result = allocateBonuses(
    [
      {
        id: '1',
        name: 'A',
        team: 'T1',
        period: '2026Q1',
        selfTotal: 0,
        managerTotal: 0,
        finalScore: 0,
        rating: 'D',
      },
    ],
    100000
  );

  assert.deepEqual(result[0], {
    id: '1',
    name: 'A',
    team: 'T1',
    period: '2026Q1',
    selfTotal: 0,
    managerTotal: 0,
    finalScore: 0,
    rating: 'D',
    share: 0,
    shareText: '0.00%',
    bonus: 0,
    bonusFormatted: '0',
  });
});
