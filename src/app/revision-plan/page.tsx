'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { RevisionPlan, RevisionTask } from '@/types';
import {
  CalendarCheck,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Sliders,
  CheckSquare,
  Square,
} from 'lucide-react';

export default function RevisionPlanPage() {
  const [plan, setPlan] = useState<RevisionPlan | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(4);
  const [hoursPerDay, setHoursPerDay] = useState(2.5);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filterDay, setFilterDay] = useState<number | 'ALL'>('ALL');

  const loadPlan = async () => {
    try {
      const res = await fetch('/api/revision-plan');
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
        setDaysRemaining(data.plan.daysRemaining || 4);
        setHoursPerDay(data.plan.hoursPerDay || 2.5);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleGeneratePlan = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/revision-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysRemaining: Number(daysRemaining),
          hoursPerDay: Number(hoursPerDay),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/revision-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          isCompleted: !currentStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Group tasks by Day
  const groupedTasks: Record<number, RevisionTask[]> = {};
  if (plan && plan.tasks) {
    plan.tasks.forEach((t) => {
      if (!groupedTasks[t.dayNumber]) groupedTasks[t.dayNumber] = [];
      groupedTasks[t.dayNumber].push(t);
    });
  }

  const completionPercent =
    plan && plan.totalTasks > 0
      ? Math.round((plan.completedTasks / plan.totalTasks) * 100)
      : 0;

  return (
    <AppLayout
      title="Personalized Revision Planner"
      subtitle="Priority study schedule based on weak topics, past paper frequencies, and days to exam"
    >
      {/* Parameter Adjustment Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Exam Preparation Parameters
              </span>
              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                Dynamic Schedule
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Customize Your Study Timeframe
            </h2>
            <p className="text-xs text-slate-500">
              Preserves finished tasks while re-arranging remaining days according to the latest gap report.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Days to Exam
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={daysRemaining}
                onChange={(e) => setDaysRemaining(Number(e.target.value))}
                className="w-24 text-sm font-bold border border-slate-200 rounded-xl px-3 py-1.5 text-center focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Hours Per Day
              </label>
              <input
                type="number"
                step={0.5}
                min={0.5}
                max={12}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="w-24 text-sm font-bold border border-slate-200 rounded-xl px-3 py-1.5 text-center focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div className="self-end">
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>Update Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar of Plan Completion */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Overall Plan Completion</span>
              <span>
                {plan?.completedTasks || 0} of {plan?.totalTasks || 0} Tasks Done (
                {completionPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Day by Day Plan Schedule */}
      <div className="space-y-6">
        {Object.keys(groupedTasks).map((dayKey) => {
          const dayNumber = Number(dayKey);
          const tasks = groupedTasks[dayNumber];
          const allDayDone = tasks.every((t) => t.isCompleted);

          return (
            <div
              key={dayNumber}
              className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${
                allDayDone ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      allDayDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    D{dayNumber}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Day {dayNumber} Revision Schedule
                    </h3>
                    <div className="text-[11px] text-slate-500">
                      {tasks.length} Structured Task(s) • ~
                      {tasks.reduce((sum, t) => sum + t.durationMinutes, 0)} Minutes
                    </div>
                  </div>
                </div>

                {allDayDone && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Day Completed</span>
                  </span>
                )}
              </div>

              {/* Task Items */}
              <div className="divide-y divide-slate-100 p-6 space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      task.isCompleted
                        ? 'bg-slate-50/60 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200/80 hover:border-indigo-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id, task.isCompleted)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {task.isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate ${
                              task.isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.topicTitle} —{' '}
                            <span className="text-indigo-600">{task.focusArea}</span>
                          </h4>

                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            {task.durationMinutes} Minutes
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {task.activity}
                        </p>

                        <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                          <span className="font-semibold text-indigo-700">
                            Objective: {task.learningObjective}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <BookOpen className="w-3 h-3" />
                            {task.sourceReference.documentName} (Page {task.sourceReference.page})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
