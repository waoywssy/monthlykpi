import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/upload/save
 * Receives edited evaluation data from the frontend and persists to DB.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeInfo, scores, selfTotal, managerTotal, finalScore, rating, selfEvaluationText, managerEvaluationText } = body;

    if (!employeeInfo?.name || !employeeInfo?.period) {
      return NextResponse.json({ success: false, error: '缺少员工姓名或考核周期' }, { status: 400 });
    }

    // ── Look up employee by unique name (master data takes priority) ──
    let employee = await prisma.employee.findUnique({
      where: { name: employeeInfo.name },
      include: { team: true },
    });

    if (!employee) {
      // Employee not in master list – auto-create with parsed info as fallback
      let team = await prisma.team.findFirst({
        where: { name: employeeInfo.team },
      });

      if (!team) {
        let dept = await prisma.department.findFirst({ where: { name: '研发中心' } });
        if (!dept) {
          dept = await prisma.department.create({ data: { name: '研发中心' } });
        }
        team = await prisma.team.create({
          data: { name: employeeInfo.team || '未分配', departmentId: dept.id },
        });
      }

      employee = await prisma.employee.create({
        data: {
          name: employeeInfo.name,
          role: employeeInfo.role || null,
          teamId: team.id,
        },
        include: { team: true },
      });
    }
    // Note: we do NOT update team/role from parsed data — master seed is the source of truth.

    // ── Upsert evaluation record ──
    const existing = await prisma.evaluationRecord.findUnique({
      where: {
        employeeId_period: {
          employeeId: employee.id,
          period: employeeInfo.period,
        },
      },
    });

    let record;
    if (existing) {
      // Delete old score items, then replace
      await prisma.scoreItem.deleteMany({ where: { evaluationRecordId: existing.id } });
      record = await prisma.evaluationRecord.update({
        where: { id: existing.id },
        data: {
          selfEvaluationText: selfEvaluationText || null,
          managerEvaluationText: managerEvaluationText || null,
          selfTotal: selfTotal ?? 0,
          managerTotal: managerTotal ?? 0,
          finalScore: finalScore ?? 0,
          rating: rating || null,
          scores: {
            create: (scores || []).map((s: any) => ({
              category: s.category,
              name: s.name,
              weight: s.weight,
              selfScore: s.selfScore,
              managerScore: s.managerScore,
            })),
          },
        },
        include: { scores: true },
      });
    } else {
      record = await prisma.evaluationRecord.create({
        data: {
          employeeId: employee.id,
          period: employeeInfo.period,
          selfEvaluationText: selfEvaluationText || null,
          managerEvaluationText: managerEvaluationText || null,
          selfTotal: selfTotal ?? 0,
          managerTotal: managerTotal ?? 0,
          finalScore: finalScore ?? 0,
          rating: rating || null,
          scores: {
            create: (scores || []).map((s: any) => ({
              category: s.category,
              name: s.name,
              weight: s.weight,
              selfScore: s.selfScore,
              managerScore: s.managerScore,
            })),
          },
        },
        include: { scores: true },
      });
    }

    return NextResponse.json({
      success: true,
      recordId: record.id,
      savedScoresCount: record.scores.length,
    });
  } catch (error: unknown) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
