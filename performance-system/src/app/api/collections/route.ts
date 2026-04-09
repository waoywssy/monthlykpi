import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const period = searchParams.get('period');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (period) where.period = period;

    const collections = await prisma.collection.findMany({
      where,
      include: {
        project: true
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(collections);
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
