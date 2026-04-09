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
    let importedCount = 0;
    
    // Process all sheets (four quarters)
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      // Use header: 1 to get array of arrays first to find the real header row
      // since Excel reports might have title rows or merged cells at the top
      const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      // Find the row index that contains "项目名称" or "回款金额"
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i] as any[];
        if (row && (row.includes('项目名称') || row.includes('回款金额'))) {
          headerRowIndex = i;
          break;
        }
      }
      
      // If we found a header row, parse the data using it
      if (headerRowIndex !== -1) {
        // Parse starting from the header row
        const data = xlsx.utils.sheet_to_json(sheet, { 
          range: headerRowIndex,
          defval: null
        });
        
        for (const row of data as any[]) {
          // Check for valid project name (skip totals/subtotals rows)
          const projectName = row['项目名称'];
          if (!projectName || projectName.toString().includes('合计') || projectName.toString().includes('小计')) {
            continue;
          }
          
          // Get amount
          const amountStr = row['回款金额'];
          if (amountStr === null || amountStr === undefined) continue;
          
          const amount = typeof amountStr === 'number' ? amountStr : parseFloat(amountStr.toString().replace(/,/g, ''));
          if (isNaN(amount) || amount === 0) continue;
          
          // Parse date
          let date = new Date();
          const dateVal = row['回款日期'];
          
          if (dateVal) {
            if (typeof dateVal === 'number') {
              // Excel serial date format
              date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            } else if (typeof dateVal === 'string') {
              // Handle various string formats
              date = new Date(dateVal.replace(/\//g, '-'));
            }
          }
          
          // Set period based on date (YYYY-MM)
          const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          // Extract notes
          const notes = row['备   注'] || row['备注'] || row['说明'] || '';
          
          // Extract project classification and type
          const projectCategory = row['项目分类'] || '';
          
          // Find or create project
          let project = await prisma.project.findUnique({
            where: { name: projectName }
          });
          
          if (!project) {
            project = await prisma.project.create({
              data: {
                name: projectName,
                description: projectCategory,
                clientName: '',
                totalAmount: 0,
                status: 'IN_PROGRESS'
              }
            });
          }
          
          // Check if exactly same record already exists to avoid duplicates
          const existingCollection = await prisma.collection.findFirst({
            where: {
              projectId: project.id,
              amount: amount,
              period: period,
            }
          });
          
          if (!existingCollection) {
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
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `成功导入 ${importedCount} 条回款记录`,
      count: importedCount
    });
  } catch (error: any) {
    console.error('Failed to upload collections:', error);
    return NextResponse.json({ 
      error: '处理文件失败', 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
