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
  GraduationCap,
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
  CartesianGrid,
} from 'recharts';
import { KnowledgeGapReport, RevisionPlan, DocumentRecord, QuizSession } from '@/types';
import { createClient } from '@/lib/supabase/client';

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
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [studentName, setStudentName] = useState('Student');
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load dynamic student profile
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gapfinder_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.fullName) setStudentName(parsed.fullName);
        if (parsed.isDemo || parsed.email === 'demo@gapfinder.ai') setIsDemoUser(true);
      } else {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.user_metadata?.full_name) {
            setStudentName(data.user.user_metadata.full_name);
          }
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Fetch all real-time dynamic statistics
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [resReport, resPlan, resDocs, resSessions] = await Promise.all([
        fetch('/api/gap-report'),
        fetch('/api/revision-plan'),
        fetch('/api/documents'),
        fetch('/api/quiz/evaluate'),
      ]);

      const dataReport = await resReport.json();
      const dataPlan = await resPlan.json();
      const dataDocs = await resDocs.json();
      const dataSessions = await resSessions.json();

      if (dataReport.success) setReport(dataReport.report);
      if (dataPlan.success) setPlan(dataPlan.plan);
      if (dataDocs.success) setDocs(dataDocs.documents);
      if (dataSessions.success) setQuizSessions(dataSessions.sessions);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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

  // Dynamic metrics calculation
  const completedQuizzesCount = quizSessions.length;
  const averageQuizScore =
    completedQuizzesCount > 0
      ? Math.round(
          quizSessions.reduce((acc, s) => acc + (s.scorePercentage || 0), 0) /
            completedQuizzesCount
        )
      : report?.overallMasteryPercentage || 0;

  // Pie chart data
  const pieData = report
    ? [
        { name: 'Weak', value: report.weakCount, color: STATUS_COLORS.WEAK },
        { name: 'Medium', value: report.mediumCount, color: STATUS_COLORS.MEDIUM },
        { name: 'Strong', value: report.strongCount, color: STATUS_COLORS.STRONG },
        { name: 'Not Assessed', value: report.notAssessedCount, color: STATUS_COLORS.NOT_ASSESSED },
      ].filter((d) => d.value > 0)
    : [];

  // Bar chart data from actual topic performances
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
          onClick={loadDashboardData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          title="Refresh metrics from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      }
    >
      {/* Welcome Hero Banner with Dynamic Student Name */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-850 to-purple-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Diagnostic Snapshot: CS-301 Machine Learning</span>
            </span>
            {isDemoUser && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[11px] font-bold">
                DEMO PROFILE ACTIVE
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {studentName}!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100 font-normal leading-relaxed">
            GapFinder AI analyzed your uploaded documents and {completedQuizzesCount} quiz session(s). You currently have{' '}
            <strong className="text-amber-300 underline font-bold">
              {report?.weakCount || 0} critical knowledge gap(s)
            </strong>{' '}
            identified for exam preparation.
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
              href="/chat"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-semibold border border-indigo-500/50 transition-all"
            >
              <span>Ask AI Assistant</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Dynamic Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Uploaded Documents</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {docs.length}
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
          <div className="text-[11px] text-slate-500 mt-0.5">Across syllabus units</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completed Quizzes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {completedQuizzesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Diagnostic test attempts</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Quiz Score</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {averageQuizScore}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Calculated from actual attempts</div>
        </div>
      </div>

      {/* Dynamic Topic Status Breakdown */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Knowledge Gap Status Summary
            </h3>
            <p className="text-xs text-slate-500">
              Thresholds: 0–49% Weak • 50–74% Medium • 75–100% Strong • No Attempts: Not Assessed
            </p>
          </div>
          <Link
            href="/gap-report"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Learning Signal Report →
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
              {report?.weakCount || 0}
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
              {report?.mediumCount || 0}
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
              {report?.strongCount || 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Not Assessed
                </div>
                <div className="text-xs text-slate-500">Pending Quiz</div>
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-700">
              {report?.notAssessedCount || 0}
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
                Live scores calculated from student quiz submissions
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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

      {/* Two Column Section: Recent Quiz Attempts & Upcoming Revision Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quiz Attempts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Diagnostic Quiz Attempts ({quizSessions.length})
              </h3>
            </div>
            <Link
              href="/quiz"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Take Quiz →
            </Link>
          </div>

          <div className="space-y-3">
            {quizSessions.slice(0, 4).map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {sess.topicName || 'Diagnostic Assessment'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {sess.createdAt ? new Date(sess.createdAt).toLocaleDateString() : 'Recent'} • {sess.totalQuestions} Questions • {sess.difficulty}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {sess.scorePercentage}%
                  </div>
                  <TopicBadge
                    status={
                      sess.scorePercentage < 50
                        ? 'WEAK'
                        : sess.scorePercentage < 75
                        ? 'MEDIUM'
                        : 'STRONG'
                    }
                    size="sm"
                  />
                </div>
              </div>
            ))}

            {quizSessions.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No quiz attempts recorded yet. Click "Take Quiz" to begin your first diagnostic test.
              </div>
            )}
          </div>
        </div>

        {/* Revision Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Upcoming Revision Tasks
              </h3>
            </div>
            <Link
              href="/revision-plan"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Full Plan ({plan?.completedTasks || 0}/{plan?.totalTasks || 0}) →
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
      </div>
    </AppLayout>
  );
}
