import { NextRequest, NextResponse } from 'next/server';
import { RAGPipeline } from '@/lib/rag';
import { StorageService } from '@/lib/storage';
import { ChatMessage } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';

    const history = await StorageService.getChatHistory(userId);
    return NextResponse.json({ success: true, messages: history });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      userId = 'demo-student-uuid-101',
      documentIds,
    } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query message is required.' },
        { status: 400 }
      );
    }

    // 1. Record student's user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    await StorageService.saveChatMessage(userId, userMsg);

    // 2. Perform vector retrieval strictly first
    const retrievedChunks = await RAGPipeline.retrieveRelevantChunks(
      userId,
      message,
      { limit: 4, documentIds }
    );

    // 3. Perform grounded generation strictly from retrieved chunks
    const result = await RAGPipeline.generateGroundedAnswer(message, retrievedChunks);

    // 4. Record assistant's grounded answer with citations
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: result.answer,
      citations: result.citations,
      timestamp: new Date().toISOString(),
    };
    await StorageService.saveChatMessage(userId, assistantMsg);

    return NextResponse.json({
      success: true,
      message: assistantMsg,
      retrievedCount: retrievedChunks.length,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Chat service failed' },
      { status: 500 }
    );
  }
}
