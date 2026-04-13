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

/** Master employee list — order matters (sortOrder = array index + 1) */
const EMPLOYEES: Array<{ name: string; team: string; role: string }> = [
  { name: '龚进',   team: 'TM',       role: 'JAVA'     },
  { name: '廖超平', team: 'TM',       role: 'JAVA'     },
  { name: '王小盼', team: 'TM',       role: '大数据'   },
  { name: '周泽星', team: '研发一组', role: 'JAVA'     },
  { name: '罗国兴', team: '研发一组', role: '前端'     },
  { name: '张英',   team: '研发一组', role: '测试'     },
  { name: '陈玲',   team: '研发二组', role: '产品经理' },
  { name: '陈巧军', team: '研发二组', role: '前端'     },
  { name: '李欢',   team: '研发二组', role: '后端'     },
  { name: '邓红雨', team: '研发二组', role: '测试'     },
  { name: '陈静',   team: '茅台项目组', role: '产品经理' },
  { name: '何勇',   team: '茅台项目组', role: '产品经理' },
  { name: '姚境',   team: '茅台项目组', role: 'JAVA'     },
  { name: '王贤涛', team: '茅台项目组', role: '前端'     },
  { name: '李嘉林', team: '茅台项目组', role: '前端'     },
  { name: '贺纯',   team: '茅台项目组', role: '测试'     },
  { name: '成忠',   team: '茅台项目组', role: '测试'     },
  { name: '胡锦栋', team: '公共资源组', role: 'iOS'      },
  { name: '屈大鹏', team: '公共资源组', role: 'Android'  },
  { name: '周强',   team: '公共资源组', role: '运维'     },
  { name: '宋扬',   team: '公共资源组', role: '配置'     },
  { name: '蒋巍',   team: '公共资源组', role: 'UI'       },
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
  for (let i = 0; i < EMPLOYEES.length; i++) {
    const e = EMPLOYEES[i];
    const teamId = teamMap.get(e.team)!;
    await prisma.employee.upsert({
      where: { name_teamId: { name: e.name, teamId } },
      update: {
        role: e.role,
        sortOrder: i + 1,
        teamId,
      },
      create: {
        name: e.name,
        role: e.role,
        sortOrder: i + 1,
        teamId,
      },
    });
    console.log(`  ✓ ${e.name} → ${e.team} / ${e.role} (sortOrder=${i + 1})`);
  }

  console.log(`\n✅ Done — ${EMPLOYEES.length} employees seeded.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
