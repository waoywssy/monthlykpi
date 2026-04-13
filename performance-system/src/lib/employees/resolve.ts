import { Prisma } from '@prisma/client';

export interface EmployeeLookupInput {
  name: string;
  team: string;
  role: string;
}

export interface EmployeeCandidate {
  id: string;
  name: string;
  role: string | null;
  teamId: string;
  team: {
    id: string;
    name: string;
  };
}

type EmployeeMatchResult =
  | { kind: 'match'; employee: EmployeeCandidate }
  | { kind: 'create' }
  | { kind: 'ambiguous' };

export function selectEmployeeForEvaluation(
  candidates: EmployeeCandidate[],
  employeeInfo: EmployeeLookupInput,
): EmployeeMatchResult {
  const teamName = normalize(employeeInfo.team);
  const roleName = normalize(employeeInfo.role);

  const teamMatches = teamName
    ? candidates.filter((candidate) => normalize(candidate.team.name) === teamName)
    : [];

  const resolvedTeamMatch = pickByRole(teamMatches, roleName);
  if (resolvedTeamMatch) {
    return resolvedTeamMatch;
  }

  if (teamMatches.length > 1) {
    return { kind: 'ambiguous' };
  }

  if (teamName) {
    return { kind: 'create' };
  }

  if (candidates.length === 1 && !teamName) {
    return { kind: 'match', employee: candidates[0] };
  }

  const resolvedGlobalMatch = pickByRole(candidates, roleName);
  if (resolvedGlobalMatch) {
    return resolvedGlobalMatch;
  }

  if (candidates.length > 0) {
    return teamName ? { kind: 'create' } : { kind: 'ambiguous' };
  }

  return { kind: 'create' };
}

export async function findOrCreateEmployeeForEvaluation(
  tx: Prisma.TransactionClient,
  employeeInfo: EmployeeLookupInput,
): Promise<EmployeeCandidate> {
  const candidates = await tx.employee.findMany({
    where: { name: employeeInfo.name },
    include: { team: true },
  });

  const selection = selectEmployeeForEvaluation(candidates, employeeInfo);
  if (selection.kind === 'match') {
    return selection.employee;
  }

  if (selection.kind === 'ambiguous') {
    throw new Error(`存在同名员工“${employeeInfo.name}”，请指定正确团队后重试`);
  }

  const team = await findOrCreateTeam(tx, employeeInfo.team);
  return tx.employee.create({
    data: {
      name: employeeInfo.name,
      role: employeeInfo.role || null,
      teamId: team.id,
    },
    include: { team: true },
  });
}

async function findOrCreateTeam(
  tx: Prisma.TransactionClient,
  teamName: string,
) {
  const normalizedTeamName = teamName.trim() || '未分配';
  const existingTeam = await tx.team.findFirst({
    where: { name: normalizedTeamName },
  });

  if (existingTeam) {
    return existingTeam;
  }

  const department = await tx.department.upsert({
    where: { name: '研发中心' },
    update: {},
    create: { name: '研发中心' },
  });

  return tx.team.create({
    data: {
      name: normalizedTeamName,
      departmentId: department.id,
    },
  });
}

function pickByRole(
  candidates: EmployeeCandidate[],
  roleName: string,
): EmployeeMatchResult | null {
  if (candidates.length === 1) {
    return { kind: 'match', employee: candidates[0] };
  }

  if (!roleName) {
    return null;
  }

  const roleMatches = candidates.filter(
    (candidate) => normalize(candidate.role) === roleName,
  );

  if (roleMatches.length === 1) {
    return { kind: 'match', employee: roleMatches[0] };
  }

  if (roleMatches.length > 1) {
    return { kind: 'ambiguous' };
  }

  return null;
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() || '';
}
