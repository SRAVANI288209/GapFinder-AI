/**
 * GapFinder AI - Knowledge Gap Analyzer (Core Engine)
 * Identifies learning gaps topic-by-topic:
 * 0–49%: WEAK (Red)
 * 50–74%: MEDIUM (Orange)
 * 75–100%: STRONG (Green)
 * No attempts: NOT ASSESSED (Grey)
 * Generates diagnosis grounded in actual student errors.
 */

import {
  GapStatus,
  KnowledgeGapReport,
  QuizSession,
  StudentAnswer,
  TopicItem,
  TopicPerformance,
} from '@/types';
import { StorageService } from './storage';

export class GapAnalyzer {
  /**
   * Evaluates all topics for a student by aggregating historical and new quiz attempts
   */
  static async computeGapReport(
    userId: string,
    subjectId: string
  ): Promise<KnowledgeGapReport> {
    const topics = await StorageService.getTopics(userId, subjectId);
    const quizSessions = await StorageService.getQuizSessions(userId);
    const pastPapers = await StorageService.getPastPapers(userId);

    // Map past paper question frequencies to topic IDs
    const examFrequencyMap = new Map<string, number>();
    pastPapers.forEach((p) => {
      if (p.mappedTopicId) {
        const current = examFrequencyMap.get(p.mappedTopicId) || 0;
        examFrequencyMap.set(p.mappedTopicId, current + (p.frequencyCount || 1));
      }
    });

    // Aggregate student answers by topic ID
    const topicAnswerMap = new Map<
      string,
      {
        totalScore: number;
        maxPossible: number;
        correctCount: number;
        incorrectCount: number;
        incorrectAnswers: StudentAnswer[];
        history: { quizDate: string; score: number }[];
      }
    >();

    // Process from oldest to newest session to track improvement history
    const sortedSessions = [...quizSessions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const session of sortedSessions) {
      // Group answers in this session by topic
      const sessionTopicScores = new Map<
        string,
        { obtained: number; max: number }
      >();

      for (const ans of session.answers) {
        const topId = ans.topicId || 'unknown';

        if (!topicAnswerMap.has(topId)) {
          topicAnswerMap.set(topId, {
            totalScore: 0,
            maxPossible: 0,
            correctCount: 0,
            incorrectCount: 0,
            incorrectAnswers: [],
            history: [],
          });
        }

        const record = topicAnswerMap.get(topId)!;
        record.totalScore += ans.scoreObtained;
        record.maxPossible += ans.maxScore;

        if (ans.isCorrect) {
          record.correctCount += 1;
        } else {
          record.incorrectCount += 1;
          record.incorrectAnswers.push(ans);
        }

        // Track session subtotal
        const currentSession = sessionTopicScores.get(topId) || {
          obtained: 0,
          max: 0,
        };
        currentSession.obtained += ans.scoreObtained;
        currentSession.max += ans.maxScore;
        sessionTopicScores.set(topId, currentSession);
      }

      // Record date snapshot
      const dateStr = session.createdAt ? session.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
      sessionTopicScores.forEach((s, topId) => {
        const pct = s.max > 0 ? Math.round((s.obtained / s.max) * 100) : 0;
        topicAnswerMap.get(topId)?.history.push({ quizDate: dateStr, score: pct });
      });
    }

    // Evaluate each topic in syllabus
    const topicPerformances: TopicPerformance[] = [];
    let weakCount = 0;
    let mediumCount = 0;
    let strongCount = 0;
    let notAssessedCount = 0;
    let totalScoreSum = 0;
    let assessedTopicCount = 0;

    for (const topic of topics) {
      const stats = topicAnswerMap.get(topic.id);
      const totalAttempted = stats
        ? stats.correctCount + stats.incorrectCount
        : 0;

      let scorePercentage = 0;
      let status: GapStatus = 'NOT_ASSESSED';
      let gapReason = 'No diagnostic quiz attempted yet for this topic.';
      let recommendation = 'Take a diagnostic quiz to identify your current baseline knowledge.';

      if (totalAttempted > 0 && stats && stats.maxPossible > 0) {
        scorePercentage = Math.round((stats.totalScore / stats.maxPossible) * 100);
        assessedTopicCount++;
        totalScoreSum += scorePercentage;

        if (scorePercentage < 50) {
          status = 'WEAK';
          weakCount++;
          gapReason = this.formulateGapReason(topic.title, stats.incorrectAnswers);
          recommendation = `High Priority: Re-study fundamental concepts in ${topic.title}. Focus on the specific questions missed and re-test within 48 hours.`;
        } else if (scorePercentage < 75) {
          status = 'MEDIUM';
          mediumCount++;
          gapReason = `Student demonstrates foundational grasp (${scorePercentage}%), but struggled with nuanced definitions or edge-case questions.`;
          recommendation = `Review textbook examples and solve 5 practice questions to advance from Medium to Strong.`;
        } else {
          status = 'STRONG';
          strongCount++;
          gapReason = `Excellent mastery demonstrated with ${scorePercentage}% accuracy across attempted questions.`;
          recommendation = `Topic mastered. Maintain memory retention with a brief 10-minute revision before the examination.`;
        }
      } else {
        notAssessedCount++;
      }

      const examFreq = examFrequencyMap.get(topic.id) || 0;

      topicPerformances.push({
        topicId: topic.id,
        topicTitle: topic.title,
        unitName: topic.unitName,
        questionsAttempted: totalAttempted,
        correctAnswers: stats ? stats.correctCount : 0,
        incorrectAnswers: stats ? stats.incorrectCount : 0,
        scorePercentage,
        status,
        gapReason,
        recommendation,
        examFrequency: examFreq,
        history: stats ? stats.history : [],
      });
    }

    const overallMastery =
      assessedTopicCount > 0 ? Math.round(totalScoreSum / assessedTopicCount) : 0;

    const report: KnowledgeGapReport = {
      subjectId,
      subjectName: topics[0]?.unitName || 'Subject Assessment',
      totalTopics: topics.length,
      assessedTopics: assessedTopicCount,
      weakCount,
      mediumCount,
      strongCount,
      notAssessedCount,
      topics: topicPerformances,
      overallMasteryPercentage: overallMastery,
      generatedAt: new Date().toISOString(),
    };

    // Save report in storage
    await StorageService.saveGapReport(userId, report);

    return report;
  }

  /**
   * Generates realistic, diagnostic reason based on student's actual incorrect answers
   */
  private static formulateGapReason(
    topicTitle: string,
    incorrectAnswers: StudentAnswer[]
  ): string {
    if (incorrectAnswers.length === 0) {
      return `Scored below 50% on questions related to ${topicTitle}.`;
    }

    // Extract specifics from evaluation feedback
    const sampleExplanations = incorrectAnswers
      .slice(0, 2)
      .map((a) => a.evaluationExplanation)
      .join(' ')
      .slice(0, 220);

    return `Struggled with ${incorrectAnswers.length} question(s) in this topic. Analysis: ${sampleExplanations}`;
  }
}
