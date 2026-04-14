/**
 * Seed script: populates the employee master data.
 *
 * Run with:  npx tsx prisma/seed.ts
 *
 * This script is idempotent — it upserts employees based on name + team,
 * and always updates role / sortOrder to match the master list.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Master employee list — TMs are placed first in their respective teams */
const EMPLOYEES: Array<{ name: string; team: string; role: string; sortOrder: number }> = [
  // 研发一组 - TM龚进排第一
  { name: '龚进',   team: '研发一组', role: 'JAVA',     sortOrder: 1 },
  { name: '周泽星', team: '研发一组', role: 'JAVA',     sortOrder: 2 },
  { name: '罗国兴', team: '研发一组', role: '前端',     sortOrder: 3 },
  { name: '张英',   team: '研发一组', role: '测试',     sortOrder: 4 },

  // 研发二组 - TM王小盼排第一
  { name: '王小盼', team: '研发二组', role: '大数据',   sortOrder: 1 },
  { name: '陈玲',   team: '研发二组', role: '产品经理', sortOrder: 2 },
  { name: '陈巧军', team: '研发二组', role: '前端',     sortOrder: 3 },
  { name: '李欢',   team: '研发二组', role: '后端',     sortOrder: 4 },
  { name: '邓红雨', team: '研发二组', role: '测试',     sortOrder: 5 },

  // 茅台项目组 - TM廖超平排第一
  { name: '廖超平', team: '茅台项目组', role: 'JAVA',     sortOrder: 1 },
  { name: '陈静',   team: '茅台项目组', role: '产品经理', sortOrder: 2 },
  { name: '何勇',   team: '茅台项目组', role: '产品经理', sortOrder: 3 },
  { name: '姚境',   team: '茅台项目组', role: 'JAVA',     sortOrder: 4 },
  { name: '王贤涛', team: '茅台项目组', role: '前端',     sortOrder: 5 },
  { name: '李嘉林', team: '茅台项目组', role: '前端',     sortOrder: 6 },
  { name: '贺纯',   team: '茅台项目组', role: '测试',     sortOrder: 7 },
  { name: '成忠',   team: '茅台项目组', role: '测试',     sortOrder: 8 },

  // 公共资源组
  { name: '胡锦栋', team: '公共资源组', role: 'iOS',      sortOrder: 1 },
  { name: '屈大鹏', team: '公共资源组', role: 'Android',  sortOrder: 2 },
  { name: '周强',   team: '公共资源组', role: '运维',     sortOrder: 3 },
  { name: '宋扬',   team: '公共资源组', role: '配置',     sortOrder: 4 },
  { name: '蒋巍',   team: '公共资源组', role: 'UI',       sortOrder: 5 },
];

async function main() {
  console.log('🌱 Seeding employee master data…');

  // Ensure the default department exists
  const dept = await prisma.department.upsert({
    where: { name: '研发中心' },
    update: {},
    create: { name: '研发中心' },
  });

  // Collect distinct teams
  const teamNames = [...new Set(EMPLOYEES.map(e => e.team))];
  const teamMap = new Map<string, string>();   // name → id

  for (const tn of teamNames) {
    const team = await prisma.team.upsert({
      where: { name_departmentId: { name: tn, departmentId: dept.id } },
      update: {},
      create: { name: tn, departmentId: dept.id },
    });
    teamMap.set(tn, team.id);
  }

  // Upsert employees
  for (const e of EMPLOYEES) {
    const teamId = teamMap.get(e.team)!;
    await prisma.employee.upsert({
      where: { name_teamId: { name: e.name, teamId } },
      update: {
        role: e.role,
        sortOrder: e.sortOrder,
        teamId,
      },
      create: {
        name: e.name,
        role: e.role,
        sortOrder: e.sortOrder,
        teamId,
      },
    });
    console.log(`  ✓ ${e.name} → ${e.team} / ${e.role} (sortOrder=${e.sortOrder})`);
  }

  console.log(`\n✅ Done — ${EMPLOYEES.length} employees seeded.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
