'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { TopicBadge } from '@/components/TopicBadge';
import {
  FileText,
  Network,
  HelpCircle,
  Award,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { KnowledgeGapReport, RevisionPlan, DocumentRecord } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  WEAK: '#ef4444',
  MEDIUM: '#f59e0b',
  STRONG: '#10b981',
  NOT_ASSESSED: '#94a3b8',
};

export default function DashboardPage() {
  const [report, setReport] = useState<KnowledgeGapReport | null>(null);
  const [plan, setPlan] = useState<RevisionPlan | null>(null);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resReport, resPlan, resDocs] = await Promise.all([
        fetch('/api/gap-report'),
        fetch('/api/revision-plan'),
        fetch('/api/documents'),
      ]);

      const dataReport = await resReport.json();
      const dataPlan = await resPlan.json();
      const dataDocs = await resDocs.json();

      if (dataReport.success) setReport(dataReport.report);
      if (dataPlan.success) setPlan(dataPlan.plan);
      if (dataDocs.success) setDocs(dataDocs.documents);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/revision-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, isCompleted: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Pie chart data
  const pieData = report
    ? [
        { name: 'Weak', value: report.weakCount, color: STATUS_COLORS.WEAK },
        { name: 'Medium', value: report.mediumCount, color: STATUS_COLORS.MEDIUM },
        { name: 'Strong', value: report.strongCount, color: STATUS_COLORS.STRONG },
        { name: 'Not Assessed', value: report.notAssessedCount, color: STATUS_COLORS.NOT_ASSESSED },
      ].filter((d) => d.value > 0)
    : [];

  // Bar chart data
  const barData = report
    ? report.topics.map((t) => ({
        name: t.topicTitle.length > 18 ? t.topicTitle.slice(0, 18) + '...' : t.topicTitle,
        score: t.scorePercentage,
        status: t.status,
      }))
    : [];

  return (
    <AppLayout
      title="Student Knowledge Dashboard"
      subtitle="AI-driven syllabus diagnosis and knowledge-gap tracking"
      actions={
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      }
    >
      {/* Welcome Banner */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-850 to-purple-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Diagnosis Snapshot: CS-301 Machine Learning</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, Arjun!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100 font-normal leading-relaxed">
            GapFinder AI analyzed your course documents. You currently have{' '}
            <strong className="text-amber-300 underline font-bold">
              {report?.weakCount || 1} high-priority knowledge gap
            </strong>{' '}
            in Deep Neural Networks that frequently appears on past semester exams.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/gap-report"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-950 text-xs font-bold hover:bg-indigo-50 shadow-sm transition-all"
            >
              <span>Inspect Gap Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/revision-plan"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-semibold border border-indigo-500/50 transition-all"
            >
              <span>View Daily Revision Plan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Uploaded Material</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {docs.length || 4}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Syllabus, notes & papers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Identified Topics</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {report?.totalTopics || 4}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across 4 syllabus units</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Assessed Topics</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {report?.assessedTopics || 3}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Via diagnostic tests</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Mastery</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {report?.overallMasteryPercentage || 64}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Goal: &gt;= 80% before exam</div>
        </div>
      </div>

      {/* Topic Status Breakdown Pills */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Knowledge Gap Status Summary
            </h3>
            <p className="text-xs text-slate-500">
              Thresholds: 0–49% Weak • 50–74% Medium • 75–100% Strong
            </p>
          </div>
          <Link
            href="/gap-report"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Full Gap Breakdown →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                  Weak
                </div>
                <div className="text-xs text-rose-600">0–49% Mastery</div>
              </div>
            </div>
            <div className="text-xl font-extrabold text-rose-700">
              {report?.weakCount || 1}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Medium
                </div>
                <div className="text-xs text-amber-600">50–74% Mastery</div>
              </div>
            </div>
            <div className="text-xl font-extrabold text-amber-700">
              {report?.mediumCount || 1}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Strong
                </div>
                <div className="text-xs text-emerald-600">75–100% Mastery</div>
              </div>
            </div>
            <div className="text-xl font-extrabold text-emerald-700">
              {report?.strongCount || 1}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Unassessed
                </div>
                <div className="text-xs text-slate-500">Pending Quiz</div>
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-700">
              {report?.notAssessedCount || 1}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Topic-Wise Scores */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Topic Mastery Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Live evaluation scores from diagnostic quiz attempts
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-500">Weak</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" />
              <span className="text-slate-500">Medium</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2" />
              <span className="text-slate-500">Strong</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Mastery Score']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Status Distribution Pie */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900">Status Distribution</h3>
          <p className="text-xs text-slate-500 mb-2">Proportion of syllabus mastery</p>

          <div className="flex-1 h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Topic(s)`, name]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-slate-600 truncate">{d.name}</span>
                <span className="font-bold text-slate-900 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Revision Tasks & High Priority Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revision Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Today's Revision Schedule
              </h3>
            </div>
            <Link
              href="/revision-plan"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Manage Plan ({plan?.completedTasks || 0}/{plan?.totalTasks || 0}) →
            </Link>
          </div>

          <div className="space-y-3">
            {plan?.tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  task.isCompleted
                    ? 'bg-slate-50/80 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => toggleTask(task.id, task.isCompleted)}
                    className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          task.isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.topicTitle}
                      </span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                        Day {task.dayNumber} • {task.durationMinutes}m
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {task.activity}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Ref: {task.sourceReference.documentName} (Page {task.sourceReference.page})
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Focus Gaps */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Critical Knowledge Gap Remediation
              </h3>
            </div>
            <Link
              href="/quiz"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Test Topics →
            </Link>
          </div>

          <div className="space-y-3">
            {report?.topics
              .filter((t) => t.status === 'WEAK' || t.status === 'MEDIUM')
              .map((top) => (
                <div
                  key={top.topicId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {top.topicTitle}
                    </span>
                    <TopicBadge status={top.status} score={top.scorePercentage} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    <strong>Diagnosis:</strong> {top.gapReason}
                  </p>
                  <div className="mt-2 text-[11px] text-indigo-700 font-medium bg-indigo-50/60 p-2 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <span className="truncate">{top.recommendation}</span>
                    <Link
                      href={`/quiz?topicId=${top.topicId}&topicTitle=${encodeURIComponent(
                        top.topicTitle
                      )}`}
                      className="ml-2 font-bold shrink-0 text-indigo-900 hover:underline"
                    >
                      Re-Test
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
