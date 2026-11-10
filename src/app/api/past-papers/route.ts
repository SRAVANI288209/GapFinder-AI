import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import { TopicMapper } from '@/lib/topic-mapper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';

    const questions = await StorageService.getPastPapers(userId);
    return NextResponse.json({ success: true, questions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pastPaperText,
      userId = 'demo-student-uuid-101',
      subjectId = 'subj-cs301',
      fileName = 'PastPaper.pdf',
    } = body;

    const existingTopics = await StorageService.getTopics(userId, subjectId);

    const mapped = await TopicMapper.mapPastPaperQuestions(
      pastPaperText,
      existingTopics,
      userId,
      subjectId,
      fileName
    );

    await StorageService.savePastPapers(userId, mapped);

    return NextResponse.json({ success: true, mappedQuestions: mapped });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
