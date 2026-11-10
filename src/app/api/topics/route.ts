import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import { TopicMapper } from '@/lib/topic-mapper';
import { TopicItem } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';
    const subjectId = searchParams.get('subjectId') || 'subj-cs301';

    const topics = await StorageService.getTopics(userId, subjectId);
    return NextResponse.json({ success: true, topics });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { syllabusText, userId = 'demo-student-uuid-101', subjectId = 'subj-cs301' } = body;

    if (!syllabusText || syllabusText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Syllabus text is required for topic extraction.' },
        { status: 400 }
      );
    }

    const extracted = await TopicMapper.extractTopicsFromSyllabus(
      syllabusText,
      userId,
      subjectId
    );

    await StorageService.saveTopics(userId, extracted);

    return NextResponse.json({ success: true, topics: extracted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'demo-student-uuid-101', updatedTopic } = body as {
      userId: string;
      updatedTopic: TopicItem;
    };

    const topics = await StorageService.getTopics(userId);
    const updated = topics.map((t) => (t.id === updatedTopic.id ? updatedTopic : t));
    await StorageService.saveTopics(userId, updated);

    return NextResponse.json({ success: true, topics: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
