import { prisma } from "@/lib/prisma";
import BonusCalculatorClient from "./bonus-client";

export const dynamic = "force-dynamic";

export default async function BonusCalculator() {
  const records = await prisma.evaluationRecord.findMany({
    include: {
      employee: {
        include: {
          team: true,
        },
      },
    },
    orderBy: [{ period: "desc" }, { finalScore: "desc" }],
  });

  // 提取所有可选周期（去重 + 降序）
  const allPeriods = Array.from(new Set(records.map((r) => r.period))).sort(
    (a, b) => b.localeCompare(a),
  );

  // 将所有记录整理成客户端需要的格式
  const allRecords = records.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    name: r.employee.name,
    team: r.employee.team.name,
    period: r.period,
    selfTotal: r.selfTotal,
    managerTotal: r.managerTotal,
    finalScore: r.finalScore,
    rating: r.rating ?? "D",
  }));

  return (
    <BonusCalculatorClient
      allRecords={allRecords}
      allPeriods={allPeriods}
      defaultPeriod={allPeriods[0] ?? ""}
    />
  );
}
