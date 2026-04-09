import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Process the data according to "2026年市场回款统计表"
    // Expecting columns like: 项目名称, 客户名称, 回款金额, 回款日期, 备注, 期间
    let importedCount = 0;
    
    for (const row of data as any[]) {
      const projectName = row['项目名称'] || row['项目'];
      if (!projectName) continue;
      
      const amountStr = row['回款金额'] || row['金额'] || '0';
      const amount = typeof amountStr === 'number' ? amountStr : parseFloat(amountStr.toString().replace(/,/g, ''));
      
      if (isNaN(amount) || amount === 0) continue;
      
      let date = new Date();
      if (row['回款日期'] || row['日期']) {
        const dateVal = row['回款日期'] || row['日期'];
        if (typeof dateVal === 'number') {
          // Excel serial date
          date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
        } else {
          date = new Date(dateVal);
        }
      }
      
      const period = row['期间'] || `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const notes = row['备注'] || '';
      
      // Find or create project
      let project = await prisma.project.findUnique({
        where: { name: projectName }
      });
      
      if (!project) {
        project = await prisma.project.create({
          data: {
            name: projectName,
            clientName: row['客户名称'] || row['客户'] || '',
            totalAmount: 0,
            status: 'IN_PROGRESS'
          }
        });
      }
      
      // Create collection record
      await prisma.collection.create({
        data: {
          projectId: project.id,
          amount,
          date,
          period,
          notes: notes.toString()
        }
      });
      
      importedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${importedCount} collections`,
      count: importedCount
    });
  } catch (error: any) {
    console.error('Failed to upload collections:', error);
    return NextResponse.json({ 
      error: 'Failed to process file', 
      details: error.message 
    }, { status: 500 });
  }
}
