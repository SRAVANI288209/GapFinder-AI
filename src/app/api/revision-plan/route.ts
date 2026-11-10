import { NextRequest, NextResponse } from 'next/server';
import { RevisionPlanner } from '@/lib/revision-planner';
import { StorageService } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';

    const plan = await StorageService.getRevisionPlan(userId);
    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'demo-student-uuid-101',
      subjectId = 'subj-cs301',
      daysRemaining = 5,
      hoursPerDay = 2.5,
    } = body;

    const plan = await RevisionPlanner.generateOrUpdatePlan({
      userId,
      subjectId,
      daysRemaining: Number(daysRemaining),
      hoursPerDay: Number(hoursPerDay),
    });

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'demo-student-uuid-101',
      taskId,
      isCompleted,
    } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      );
    }

    const updatedPlan = await StorageService.toggleRevisionTask(
      userId,
      taskId,
      Boolean(isCompleted)
    );

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
