import { NextRequest, NextResponse } from 'next/server';
import { AnswerEvaluator } from '@/lib/answer-evaluator';
import { GapAnalyzer } from '@/lib/gap-analyzer';
import { StorageService } from '@/lib/storage';
import { QuizQuestion, StudentAnswer, QuizSession } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'demo-student-uuid-101',
      subjectId = 'subj-cs301',
      topicId,
      topicName,
      difficulty = 'intermediate',
      questions,
      submittedAnswers, // array of { questionId, studentAnswer }
    } = body as {
      userId: string;
      subjectId: string;
      topicId: string;
      topicName: string;
      difficulty: any;
      questions: QuizQuestion[];
      submittedAnswers: { questionId: string; studentAnswer: string }[];
    };

    if (!questions || !submittedAnswers) {
      return NextResponse.json(
        { success: false, error: 'Questions and answers are required.' },
        { status: 400 }
      );
    }

    const evaluatedAnswers: StudentAnswer[] = [];
    let totalScoreObtained = 0;
    let maxPossibleScore = 0;

    // Evaluate each question using either deterministic check or Groq LLM
    for (const q of questions) {
      const studentSub = submittedAnswers.find((a) => a.questionId === q.id);
      const answerText = studentSub ? studentSub.studentAnswer : '';

      const evaluated = await AnswerEvaluator.evaluateAnswer(q, answerText);
      evaluatedAnswers.push(evaluated);

      totalScoreObtained += evaluated.scoreObtained;
      maxPossibleScore += evaluated.maxScore;
    }

    const scorePercentage =
      maxPossibleScore > 0
        ? Math.round((totalScoreObtained / maxPossibleScore) * 100)
        : 0;

    // Save Quiz Session
    const session: QuizSession = {
      id: `session-${Date.now()}`,
      userId,
      subjectId,
      topicId,
      topicName,
      difficulty,
      totalQuestions: questions.length,
      scorePercentage,
      questions,
      answers: evaluatedAnswers,
      createdAt: new Date().toISOString(),
    };

    await StorageService.saveQuizSession(userId, session);

    // Recompute knowledge gap diagnosis after new quiz results
    const updatedGapReport = await GapAnalyzer.computeGapReport(userId, subjectId);

    return NextResponse.json({
      success: true,
      scorePercentage,
      totalScoreObtained,
      maxPossibleScore,
      evaluatedAnswers,
      updatedGapReport,
    });
  } catch (err: any) {
    console.error('Quiz evaluation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Evaluation failed' },
      { status: 500 }
    );
  }
}
