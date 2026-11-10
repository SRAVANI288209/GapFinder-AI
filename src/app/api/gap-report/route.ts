import { NextRequest, NextResponse } from 'next/server';
import { GapAnalyzer } from '@/lib/gap-analyzer';
import { StorageService } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';
    const subjectId = searchParams.get('subjectId') || 'subj-cs301';
    const recalculate = searchParams.get('recalculate') === 'true';

    let report;
    if (recalculate) {
      report = await GapAnalyzer.computeGapReport(userId, subjectId);
    } else {
      report = await StorageService.getGapReport(userId);
    }

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
