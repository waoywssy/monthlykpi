import { NextResponse } from 'next/server';
import { parseEvaluationWord } from '@/lib/word/parser';
import { calculateScore, type EvaluationResult } from '@/lib/evaluation/engine';

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

    // Use parsed totals only when they match the recalculated scores.
    const data = {
      ...parsed,
      ...(hasConsistentSummary(parsed, calc)
        ? {
            selfTotal: parsed.selfTotal,
            managerTotal: parsed.managerTotal,
            finalScore: parsed.finalScore,
            rating: parsed.rating,
          }
        : calc),
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

function hasConsistentSummary(
  parsed: {
    selfTotal: number;
    managerTotal: number;
    finalScore: number;
    rating: string;
  },
  calculated: EvaluationResult,
) {
  return (
    Math.abs(parsed.selfTotal - calculated.selfTotal) <= 0.01 &&
    Math.abs(parsed.managerTotal - calculated.managerTotal) <= 0.01 &&
    Math.abs(parsed.finalScore - calculated.finalScore) <= 0.01 &&
    parsed.rating === calculated.rating
  );
}
