import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';

    await StorageService.deleteDocument(userId, id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
