import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 });
    }

    // First check if the record exists
    const record = await prisma.evaluationRecord.findUnique({
      where: { id },
      include: {
        scores: true
      }
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Delete the record using a transaction to ensure score items are deleted first
    // just in case cascade is not set up
    await prisma.$transaction([
      prisma.scoreItem.deleteMany({
        where: { evaluationRecordId: id }
      }),
      prisma.evaluationRecord.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete record:', error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}
