import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { prepareEvaluationForSave } from '@/lib/evaluation/save';
import { findOrCreateEmployeeForEvaluation } from '@/lib/employees/resolve';

/**
 * POST /api/upload/save
 * Receives edited evaluation data from the frontend and persists to DB.
 */
export async function POST(request: Request) {
  try {
    const prepared = prepareEvaluationForSave(await request.json());

    const record = await prisma.$transaction(async (tx) => {
      const employee = await findOrCreateEmployeeForEvaluation(tx, prepared.employeeInfo);

      return tx.evaluationRecord.upsert({
        where: {
          employeeId_period: {
            employeeId: employee.id,
            period: prepared.employeeInfo.period,
          },
        },
        create: {
          employeeId: employee.id,
          period: prepared.employeeInfo.period,
          selfEvaluationText: prepared.selfEvaluationText,
          managerEvaluationText: prepared.managerEvaluationText,
          selfTotal: prepared.selfTotal,
          managerTotal: prepared.managerTotal,
          finalScore: prepared.finalScore,
          rating: prepared.rating,
          scores: {
            create: prepared.scores,
          },
        },
        update: {
          selfEvaluationText: prepared.selfEvaluationText,
          managerEvaluationText: prepared.managerEvaluationText,
          selfTotal: prepared.selfTotal,
          managerTotal: prepared.managerTotal,
          finalScore: prepared.finalScore,
          rating: prepared.rating,
          scores: {
            deleteMany: {},
            create: prepared.scores,
          },
        },
        include: { scores: true },
      });
    });

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
