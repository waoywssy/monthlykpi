import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCollectionsWorkbook } from '@/lib/collections/import';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rows = parseCollectionsWorkbook(buffer);

    await prisma.$transaction(async (tx) => {
      await tx.collection.deleteMany({});

      const projectIds = new Map<string, string>();
      for (const row of rows) {
        let projectId = projectIds.get(row.projectName);

        if (!projectId) {
          const project = await tx.project.upsert({
            where: { name: row.projectName },
            update: row.projectCategory
              ? { category: row.projectCategory }
              : {},
            create: {
              name: row.projectName,
              category: row.projectCategory || null,
              description: '',
              clientName: '',
              totalAmount: 0,
              status: 'IN_PROGRESS',
            },
          });
          projectId = project.id;
          projectIds.set(row.projectName, project.id);
        }

        await tx.collection.create({
          data: {
            projectId,
            amount: row.amount,
            date: row.date,
            period: row.period,
            notes: row.notes || null,
          },
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `成功导入 ${rows.length} 条回款记录（已覆盖旧数据）`,
      count: rows.length,
    });
  } catch (error: any) {
    console.error('Failed to upload collections:', error);
    return NextResponse.json({ 
      error: '处理文件失败', 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
