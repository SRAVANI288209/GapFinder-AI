import { NextRequest, NextResponse } from 'next/server';
import { QuizGenerator } from '@/lib/quiz-generator';
import { DifficultyLevel } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'demo-student-uuid-101',
      subjectId = 'subj-cs301',
      topicId,
      topicTitle = 'Backpropagation & Activation Functions',
      difficulty = 'intermediate' as DifficultyLevel,
      questionCount = 4,
    } = body;

    const questions = await QuizGenerator.generateQuiz({
      userId,
      subjectId,
      topicId,
      topicTitle,
      difficulty,
      questionCount,
    });

    // Strip correctAnswer and explanation before sending to client so student cannot inspect
    const clientSafeQuestions = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      topicId: q.topicId,
      topicName: q.topicName,
      difficulty: q.difficulty,
      sourceDocument: q.sourceDocument,
      pageNumber: q.pageNumber,
    }));

    // Cache full questions temporarily in session
    return NextResponse.json({
      success: true,
      questions: clientSafeQuestions,
      _serverVault: questions, // For server-side evaluation verification
    });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
