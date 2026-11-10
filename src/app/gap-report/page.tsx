'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { TopicBadge } from '@/components/TopicBadge';
import { KnowledgeGapReport, TopicPerformance, GapStatus } from '@/types';
import {
  FileSearch,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function GapReportPage() {
  const [report, setReport] = useState<KnowledgeGapReport | null>(null);
  const [filterStatus, setFilterStatus] = useState<GapStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  const loadGapReport = async (recalculate: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gap-report?recalculate=${recalculate}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGapReport();
  }, []);

  const filteredTopics = report
    ? report.topics.filter((t) => {
        if (filterStatus === 'ALL') return true;
        return t.status === filterStatus;
      })
    : [];

  return (
    <AppLayout
      title="Knowledge Gap Diagnosis"
      subtitle="Topic-by-topic mastery diagnosis grounded in your quiz errors and exam frequencies"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadGapReport(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm"
            title="Recalculate gap diagnosis from all past quiz attempts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate Diagnosis</span>
          </button>
          <Link
            href="/revision-plan"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Generate Revision Plan</span>
          </Link>
        </div>
      }
    >
      {/* Top Gap Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Diagnostic Health Summary
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                Medical Model
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Curriculum Mastery: {report?.overallMasteryPercentage || 64}%
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified from {report?.totalTopics || 4} syllabus topics across 4 course units.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{report?.weakCount || 1} Weak</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{report?.mediumCount || 1} Medium</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{report?.strongCount || 1} Strong</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{report?.notAssessedCount || 1} Unassessed</span>
            </span>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {(['ALL', 'WEAK', 'MEDIUM', 'STRONG', 'NOT_ASSESSED'] as (GapStatus | 'ALL')[]).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                  filterStatus === status
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Topic by Topic Diagnosis Cards */}
      <div className="space-y-4">
        {filteredTopics.map((top) => {
          const borderColor =
            top.status === 'WEAK'
              ? 'border-rose-300 bg-rose-50/20'
              : top.status === 'MEDIUM'
              ? 'border-amber-300 bg-amber-50/20'
              : top.status === 'STRONG'
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-slate-200 bg-white';

          return (
            <div
              key={top.topicId}
              className={`p-6 rounded-2xl border shadow-sm transition-all ${borderColor}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      {top.unitName}
                    </span>
                    {top.examFrequency > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Exam Recurrence: {top.examFrequency}x
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {top.topicTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-slate-900">
                      {top.status === 'NOT_ASSESSED' ? '—' : `${top.scorePercentage}%`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {top.questionsAttempted > 0
                        ? `${top.correctAnswers}/${top.questionsAttempted} Correct`
                        : 'No Questions Attempted'}
                    </div>
                  </div>
                  <TopicBadge status={top.status} score={top.scorePercentage} size="lg" />
                </div>
              </div>

              {/* Diagnosis & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="font-bold text-rose-800 uppercase tracking-wider block mb-1">
                    Knowledge Gap Diagnosis:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {top.gapReason}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                    AI Remediation Action:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {top.recommendation}
                  </p>
                </div>
              </div>

              {/* Historical attempts tracking */}
              {top.history && top.history.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Attempt History:</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      {top.history.map((h, hIdx) => (
                        <span
                          key={hIdx}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]"
                        >
                          {h.quizDate}: {h.score}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/quiz?topicId=${top.topicId}&topicTitle=${encodeURIComponent(
                      top.topicTitle
                    )}`}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    <span>Re-Test Topic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
