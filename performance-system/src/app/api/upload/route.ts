import { NextResponse } from 'next/server';
import { parseEvaluationWord } from '@/lib/word/parser';
import { calculateScore } from '@/lib/evaluation/engine';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: '未上传文件' },
        { status: 400 },
      );
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json(
        { success: false, error: '仅支持 .docx 格式的 Word 文件' },
        { status: 400 },
      );
    }

    // Parse from buffer directly — no temp file needed
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseEvaluationWord(buffer);

    // Re-calculate totals to verify / fallback
    const calc = calculateScore(parsed);

    // Use doc's own totals if they look sane, otherwise use calculated
    const data = {
      ...parsed,
      selfTotal: parsed.selfTotal || calc.selfTotal,
      managerTotal: parsed.managerTotal || calc.managerTotal,
      finalScore: parsed.finalScore || calc.finalScore,
      rating: parsed.rating || calc.rating,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
