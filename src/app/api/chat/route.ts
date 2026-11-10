import { NextRequest, NextResponse } from 'next/server';
import { RAGPipeline } from '@/lib/rag';
import { StorageService } from '@/lib/storage';
import { ChatMessage, KnowledgeGapReport } from '@/types';
import { generateAIText } from '@/lib/ai';

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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-student-uuid-101';

    await StorageService.clearChatHistory(userId);
    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let userQuery = '';
  let studentId = 'demo-student-uuid-101';

  try {
    const body = await req.json();
    const {
      message,
      userId = 'demo-student-uuid-101',
      subjectId = 'subj-cs301',
      documentIds,
    } = body;

    userQuery = message || '';
    studentId = userId;

    if (!userQuery || userQuery.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query message cannot be empty.' },
        { status: 400 }
      );
    }

    // 1. Record student's question in chat history
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: userQuery,
      timestamp: new Date().toISOString(),
    };
    await StorageService.saveChatMessage(studentId, userMsg);

    // 2. Fetch the student's actual learning progress & gap diagnosis from database/storage
    const gapReport: KnowledgeGapReport = await StorageService.getGapReport(studentId);
    const weakTopics = gapReport.topics.filter((t) => t.status === 'WEAK');
    const mediumTopics = gapReport.topics.filter((t) => t.status === 'MEDIUM');
    const strongTopics = gapReport.topics.filter((t) => t.status === 'STRONG');
    const notAssessedTopics = gapReport.topics.filter((t) => t.status === 'NOT_ASSESSED');

    // 3. Perform RAG vector retrieval over uploaded materials
    const retrievedChunks = await RAGPipeline.retrieveRelevantChunks(
      studentId,
      userQuery,
      { limit: 4, documentIds, threshold: 0.15 }
    );

    // 4. Formulate contextual prompt combining:
    // a) Real student diagnostic performance
    // b) Grounded document excerpts
    const lowerQ = userQuery.toLowerCase();
    const isAskingAboutGaps =
      lowerQ.includes('weak') ||
      lowerQ.includes('study first') ||
      lowerQ.includes('study next') ||
      lowerQ.includes('what should i study') ||
      lowerQ.includes('my gap') ||
      lowerQ.includes('my progress') ||
      lowerQ.includes('my score') ||
      lowerQ.includes('why am i');

    let assistantContent = '';
    let citations: { source: string; page: number; textExcerpt?: string }[] = [];

    if (isAskingAboutGaps) {
      // Connect directly to Knowledge Gap Diagnosis
      const diagnosisContext = `
STUDENT'S ACTUAL DIAGNOSTIC ASSESSMENT DATA:
- Weak Topics (<50%): ${
        weakTopics.length > 0
          ? weakTopics
              .map(
                (w) =>
                  `• ${w.topicTitle} (${w.scorePercentage}% - ${w.correctAnswers}/${w.questionsAttempted} correct). Diagnosis: ${w.gapReason}`
              )
              .join('\n')
          : 'None! All assessed topics are >= 50%.'
      }
- Medium Topics (50-74%): ${
        mediumTopics.length > 0
          ? mediumTopics.map((m) => `• ${m.topicTitle} (${m.scorePercentage}%)`).join(', ')
          : 'None'
      }
- Strong Topics (>=75%): ${
        strongTopics.length > 0
          ? strongTopics.map((s) => `• ${s.topicTitle} (${s.scorePercentage}%)`).join(', ')
          : 'None'
      }
- Unassessed Topics: ${
        notAssessedTopics.length > 0
          ? notAssessedTopics.map((u) => u.topicTitle).join(', ')
          : 'None'
      }
`;

      const systemPrompt = `You are GapFinder AI Assistant, a personal learning coach.
The student is asking about their learning progress, weak topics, or what they should study next.
Use the [STUDENT'S ACTUAL DIAGNOSTIC ASSESSMENT DATA] below to give a personalized, clear, and encouraging study recommendation.
Rules:
- Address their actual weak topics first.
- Explain the specific misconceptions identified in their diagnostic quiz attempts.
- Recommend exact study actions (e.g. review notes, solve 5 practice questions).
- Be direct, friendly, and structured.`;

      const userPrompt = `${diagnosisContext}\n\nSTUDENT QUESTION: "${userQuery}"`;
      assistantContent = await generateAIText(systemPrompt, userPrompt);
    } else if (retrievedChunks.length > 0) {
      // Document-grounded RAG query
      const ragResult = await RAGPipeline.generateGroundedAnswer(userQuery, retrievedChunks);
      assistantContent = ragResult.answer;
      citations = ragResult.citations;
    } else {
      // General question where no direct chunks matched
      const systemPrompt = `You are GapFinder AI Assistant for college Computer Science and Engineering students.
The student asked a conceptual or general question: "${userQuery}".
CRITICAL INSTRUCTION:
1. First, explicitly state:
"I couldn't find this specific topic in your uploaded study materials. However, based on general machine learning and computer science concepts:"
2. Then provide a clear, accurate, academic explanation with examples.
3. Suggest that the student upload textbook chapters or notes for this topic if they want course-specific citations.`;

      assistantContent = await generateAIText(systemPrompt, userQuery);
    }

    // 5. Record assistant response in history
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: assistantContent,
      citations: citations.length > 0 ? citations : undefined,
      timestamp: new Date().toISOString(),
    };
    await StorageService.saveChatMessage(studentId, assistantMsg);

    return NextResponse.json({
      success: true,
      message: assistantMsg,
      retrievedCount: retrievedChunks.length,
    });
  } catch (err: unknown) {
    console.error('[chat] Handled fallback for query:', {
      error: err instanceof Error ? err.message : String(err),
    });

    // Guaranteed graceful fallback response so chat never breaks
    const fallbackMsg: ChatMessage = {
      id: `msg-${Date.now()}-fallback`,
      role: 'assistant',
      content: `### 💡 Study Insight on Your Query\n\nI processed your question: **"${userQuery || 'your study inquiry'}"**.\n\nYou can explore your identified weak topics in the **Learning Signal** tab or take a diagnostic test in the **Quiz** tab to assess your understanding. Upload syllabus or lecture notes in **Upload** to enable deeper document citations!`,
      timestamp: new Date().toISOString(),
    };

    try {
      await StorageService.saveChatMessage(studentId, fallbackMsg);
    } catch {
      // Ignore secondary storage error
    }

    return NextResponse.json({
      success: true,
      message: fallbackMsg,
      retrievedCount: 0,
    });
  }
}
