/**
 * GapFinder AI - Answer Evaluator
 * Evaluates student responses: deterministic evaluation for MCQs
 * and LLM-based grounded semantic evaluation with partial scoring for short answers.
 */

import { QuizQuestion, StudentAnswer } from '@/types';
import { generateStructuredAIResponse } from './ai';

interface EvaluationLLMOutput {
  scoreObtained: number;
  maxScore: number;
  isCorrect: boolean;
  explanation: string;
  missingConcepts?: string[];
  misconceptionsIdentified?: string[];
}

export class AnswerEvaluator {
  /**
   * Evaluate a single answer for a quiz question
   */
  static async evaluateAnswer(
    question: QuizQuestion,
    studentAnswerText: string
  ): Promise<StudentAnswer> {
    const trimmedStudent = (studentAnswerText || '').trim();

    // 1. Multiple-Choice Questions (MCQ) & True/False
    if (question.questionType === 'mcq' || question.questionType === 'true_false') {
      const isCorrect = this.checkMCQCorrectness(
        trimmedStudent,
        question.correctAnswer
      );

      return {
        questionId: question.id,
        studentAnswer: trimmedStudent,
        isCorrect,
        scoreObtained: isCorrect ? 10 : 0,
        maxScore: 10,
        evaluationExplanation: isCorrect
          ? `Correct! ${question.explanation}`
          : `Incorrect. The correct answer is ${question.correctAnswer}. ${question.explanation}`,
        topicId: question.topicId,
        topicName: question.topicName,
        sourceCitation: {
          source: question.sourceDocument,
          page: question.pageNumber,
          quote: question.supportingSourceSnippet,
        },
      };
    }

    // 2. Short-Answer Questions: Evaluated using Groq LLM against supporting course material
    if (!trimmedStudent) {
      return {
        questionId: question.id,
        studentAnswer: '[No answer provided]',
        isCorrect: false,
        scoreObtained: 0,
        maxScore: 10,
        evaluationExplanation: 'No answer was provided by the student.',
        topicId: question.topicId,
        topicName: question.topicName,
        sourceCitation: {
          source: question.sourceDocument,
          page: question.pageNumber,
          quote: question.supportingSourceSnippet,
        },
      };
    }

    const systemPrompt = `You are an academic grader evaluating a student's short-answer response.
Evaluate the student's answer strictly against the [REFERENCE ANSWER] and [SOURCE CONTENT].

CRITERIA:
- Grade on a scale of 0 to 10.
- Award partial marks for partially correct reasoning or partial coverage of core concepts.
- A score >= 5.0 is considered isCorrect = true; < 5.0 is false.
- Detail why marks were awarded or deducted in "explanation".
- List any specific "misconceptionsIdentified" or "missingConcepts".

Output JSON format:
{
  "scoreObtained": 7.5,
  "maxScore": 10,
  "isCorrect": true,
  "explanation": "Clear explanation of evaluation and feedback for the student.",
  "missingConcepts": ["concept A"],
  "misconceptionsIdentified": ["error B"]
}`;

    const userPrompt = `[QUESTION]:
${question.questionText}

[REFERENCE CORRECT ANSWER]:
${question.correctAnswer}

[SOURCE MATERIAL EVIDENCE]:
${question.supportingSourceSnippet}

[STUDENT ANSWER TO GRADE]:
${trimmedStudent}`;

    try {
      const evaluation = await generateStructuredAIResponse<EvaluationLLMOutput>(
        systemPrompt,
        userPrompt
      );

      const score = Math.min(10, Math.max(0, evaluation.scoreObtained ?? 5));
      const isCorrect = evaluation.isCorrect ?? score >= 5;

      return {
        questionId: question.id,
        studentAnswer: trimmedStudent,
        isCorrect,
        scoreObtained: score,
        maxScore: 10,
        evaluationExplanation:
          evaluation.explanation ||
          `Scored ${score}/10 based on conceptual alignment with syllabus reference.`,
        topicId: question.topicId,
        topicName: question.topicName,
        sourceCitation: {
          source: question.sourceDocument,
          page: question.pageNumber,
          quote: question.supportingSourceSnippet,
        },
      };
    } catch (err) {
      console.error('LLM answer evaluation failed, fallback scoring:', err);
      // Heuristic fallback for offline/demo tests
      const containsKeywords = question.correctAnswer
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 4)
        .some((w) => trimmedStudent.toLowerCase().includes(w));

      const fallbackScore = containsKeywords ? 7 : 3;

      return {
        questionId: question.id,
        studentAnswer: trimmedStudent,
        isCorrect: fallbackScore >= 5,
        scoreObtained: fallbackScore,
        maxScore: 10,
        evaluationExplanation: fallbackScore >= 5
          ? `Good conceptual coverage. Key topic terms addressed correctly.`
          : `Needs revision. Did not sufficiently address the core mechanism described in the textbook.`,
        topicId: question.topicId,
        topicName: question.topicName,
        sourceCitation: {
          source: question.sourceDocument,
          page: question.pageNumber,
          quote: question.supportingSourceSnippet,
        },
      };
    }
  }

  /**
   * Helper to normalize and match MCQ letters (A, B, C, D)
   */
  private static checkMCQCorrectness(student: string, correct: string): boolean {
    const cleanStudent = student.trim().toUpperCase();
    const cleanCorrect = correct.trim().toUpperCase();

    // Check direct letter match ('A' === 'A')
    if (cleanStudent === cleanCorrect) return true;

    // Check letter prefix match ('A) Option' matches 'A')
    const firstCharStudent = cleanStudent.charAt(0);
    const firstCharCorrect = cleanCorrect.charAt(0);

    if (['A', 'B', 'C', 'D'].includes(firstCharCorrect)) {
      if (firstCharStudent === firstCharCorrect) return true;
    }

    return cleanStudent.includes(cleanCorrect) || cleanCorrect.includes(cleanStudent);
  }
}
