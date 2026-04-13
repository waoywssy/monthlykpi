import test from 'node:test';
import assert from 'node:assert/strict';

import { selectEmployeeForEvaluation, type EmployeeCandidate } from '@/lib/employees/resolve';

function candidate(overrides: Partial<EmployeeCandidate>): EmployeeCandidate {
  return {
    id: 'emp-1',
    name: '宋扬',
    role: '配置',
    teamId: 'team-1',
    team: {
      id: 'team-1',
      name: '公共资源组',
    },
    ...overrides,
  };
}

test('selectEmployeeForEvaluation prefers exact team match for duplicate names', () => {
  const result = selectEmployeeForEvaluation(
    [
      candidate({ id: 'emp-1', teamId: 'team-1', team: { id: 'team-1', name: '公共资源组' } }),
      candidate({ id: 'emp-2', teamId: 'team-2', team: { id: 'team-2', name: '研发一组' } }),
    ],
    {
      name: '宋扬',
      team: '研发一组',
      role: '',
    },
  );

  assert.equal(result.kind, 'match');
  if (result.kind === 'match') {
    assert.equal(result.employee.id, 'emp-2');
  }
});

test('selectEmployeeForEvaluation returns create when same name exists only in another team', () => {
  const result = selectEmployeeForEvaluation(
    [candidate({ id: 'emp-1', teamId: 'team-1', team: { id: 'team-1', name: '公共资源组' } })],
    {
      name: '宋扬',
      team: '研发二组',
      role: '',
    },
  );

  assert.deepEqual(result, { kind: 'create' });
});
