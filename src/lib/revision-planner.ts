/**
 * GapFinder AI - Personalized Revision Planner
 * Builds time-budgeted, priority-ranked daily study schedules based on:
 * 1. Weak topics first, followed by Medium topics
 * 2. Exam frequency from past papers
 * 3. Days remaining and hours available per day
 * Preserves completed tasks upon plan updates after re-testing!
 */

import {
  KnowledgeGapReport,
  RevisionPlan,
  RevisionTask,
  TopicPerformance,
} from '@/types';
import { StorageService } from './storage';

export interface RevisionPlanInput {
  userId: string;
  subjectId: string;
  daysRemaining: number;
  hoursPerDay: number;
}

export class RevisionPlanner {
  /**
   * Generates or dynamically re-adjusts a personalized revision plan
   */
  static async generateOrUpdatePlan(
    input: RevisionPlanInput,
    latestGapReport?: KnowledgeGapReport
  ): Promise<RevisionPlan> {
    const { userId, subjectId, daysRemaining, hoursPerDay } = input;

    // Get current gap report if not provided
    const gapReport =
      latestGapReport || (await StorageService.getGapReport(userId));

    // Get any existing plan to preserve already completed tasks
    const existingPlan = await StorageService.getRevisionPlan(userId);
    const existingCompleted = (existingPlan?.tasks || []).filter(
      (t) => t.isCompleted
    );

    // Filter topics that need attention (Weak first, then Medium, then Unassessed)
    const weakTopics = gapReport.topics.filter((t) => t.status === 'WEAK');
    const mediumTopics = gapReport.topics.filter((t) => t.status === 'MEDIUM');
    const unassessedTopics = gapReport.topics.filter(
      (t) => t.status === 'NOT_ASSESSED'
    );

    // Sort priority: higher past-exam frequency first
    weakTopics.sort((a, b) => (b.examFrequency || 0) - (a.examFrequency || 0));
    mediumTopics.sort((a, b) => (b.examFrequency || 0) - (a.examFrequency || 0));

    const totalDays = Math.max(1, Math.min(30, daysRemaining));
    const dailyMinutes = Math.round(hoursPerDay * 60);

    const newTasks: RevisionTask[] = [];
    const planId = `plan-${Date.now()}`;
    let taskCounter = 1;

    // Create a prioritized queue of topics
    const targetTopics: { topic: TopicPerformance; priority: 'WEAK' | 'MEDIUM' | 'UNASSESSED' }[] = [
      ...weakTopics.map((t) => ({ topic: t, priority: 'WEAK' as const })),
      ...mediumTopics.map((t) => ({ topic: t, priority: 'MEDIUM' as const })),
      ...unassessedTopics.map((t) => ({ topic: t, priority: 'UNASSESSED' as const })),
    ];

    if (targetTopics.length === 0) {
      // All topics are strong! Create master exam rehearsal tasks
      const allTopics = gapReport.topics;
      for (let day = 1; day <= totalDays; day++) {
        const top = allTopics[(day - 1) % allTopics.length] || {
          topicId: 'general',
          topicTitle: 'Comprehensive Review',
          unitName: 'All Units',
        };

        newTasks.push({
          id: `task-${planId}-${taskCounter++}`,
          revisionPlanId: planId,
          dayNumber: day,
          topicId: top.topicId,
          topicTitle: top.topicTitle,
          focusArea: 'Speed Drill & Timed Past Paper',
          durationMinutes: Math.min(90, dailyMinutes),
          activity: 'Full timed past paper solving and formula flashcards revision.',
          learningObjective: 'Maintain peak retention and exam speed.',
          sourceReference: {
            documentName: 'Exam_Past_Papers.pdf',
            page: 1,
          },
          isCompleted: false,
        });
      }
    } else {
      // Allocate tasks across available days
      let topicIdx = 0;

      for (let day = 1; day <= totalDays; day++) {
        let dayMinutesAllocated = 0;

        // Reserve final day for re-testing weak areas if daysRemaining >= 2
        if (day === totalDays && totalDays >= 2 && weakTopics.length > 0) {
          const weakest = weakTopics[0];
          newTasks.push({
            id: `task-${planId}-${taskCounter++}`,
            revisionPlanId: planId,
            dayNumber: day,
            topicId: weakest.topicId,
            topicTitle: weakest.topicTitle,
            focusArea: 'Diagnostic Re-Test & Verification',
            durationMinutes: Math.min(60, dailyMinutes),
            activity: `Take a 10-question re-test on ${weakest.topicTitle} to verify score improvement from ${weakest.scorePercentage}% to >= 75%.`,
            learningObjective: 'Confirm gap remediation before the final examination.',
            sourceReference: {
              documentName: 'Diagnostic_ReTest.pdf',
              page: 1,
            },
            isCompleted: false,
          });
          continue;
        }

        // Allocate 1 to 2 focused revision blocks per day
        while (dayMinutesAllocated < dailyMinutes && topicIdx < targetTopics.length) {
          const { topic, priority } = targetTopics[topicIdx];
          const taskDuration = Math.min(60, dailyMinutes - dayMinutesAllocated);

          if (taskDuration < 30 && dayMinutesAllocated > 0) {
            break; // Move to next day if remaining time is too small
          }

          let activity = '';
          let focusArea = '';
          let objective = '';

          if (priority === 'WEAK') {
            focusArea = `Core Gap Remediation: ${topic.topicTitle}`;
            activity = `Read textbook explanations and solve 5 fundamental numerical / theoretical problems.`;
            objective = `Address specific gap: ${topic.gapReason.slice(0, 80)}...`;
          } else if (priority === 'MEDIUM') {
            focusArea = `Advancement: ${topic.topicTitle}`;
            activity = `Review high-frequency past exam questions (appeared ${topic.examFrequency}x) and edge case scenarios.`;
            objective = `Push score from ${topic.scorePercentage}% to Strong tier (>75%).`;
          } else {
            focusArea = `Baseline Assessment: ${topic.topicTitle}`;
            activity = `Take a short diagnostic quiz and skim lecture slides.`;
            objective = `Determine initial mastery level.`;
          }

          newTasks.push({
            id: `task-${planId}-${taskCounter++}`,
            revisionPlanId: planId,
            dayNumber: day,
            topicId: topic.topicId,
            topicTitle: topic.topicTitle,
            focusArea,
            durationMinutes: taskDuration > 0 ? taskDuration : 45,
            activity,
            learningObjective: objective,
            sourceReference: {
              documentName: `${topic.unitName.replace(/[^a-zA-Z0-9]/g, '_')}_Material.pdf`,
              page: 1,
            },
            isCompleted: false,
          });

          dayMinutesAllocated += taskDuration;
          topicIdx = (topicIdx + 1) % targetTopics.length; // cycle if more days than topics
        }
      }
    }

    // Merge in previously completed tasks that the student finished
    const finalTasks: RevisionTask[] = [];
    existingCompleted.forEach((comp) => {
      finalTasks.push(comp);
    });

    // Add new tasks ensuring unique IDs
    newTasks.forEach((nt) => {
      const alreadyHasCompleted = existingCompleted.some(
        (c) => c.topicId === nt.topicId && c.focusArea === nt.focusArea
      );
      if (!alreadyHasCompleted) {
        finalTasks.push(nt);
      }
    });

    // Sort final tasks by dayNumber
    finalTasks.sort((a, b) => a.dayNumber - b.dayNumber);

    const completedCount = finalTasks.filter((t) => t.isCompleted).length;

    const plan: RevisionPlan = {
      id: planId,
      userId,
      subjectId,
      daysRemaining: totalDays,
      hoursPerDay,
      totalTasks: finalTasks.length,
      completedTasks: completedCount,
      tasks: finalTasks,
      createdAt: existingPlan ? existingPlan.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await StorageService.saveRevisionPlan(userId, plan);
    return plan;
  }
}
