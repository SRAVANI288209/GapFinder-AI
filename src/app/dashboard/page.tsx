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
  Trash2,
  BookOpen,
  Activity,
  PlayCircle,
  Bot,
  Layers,
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
  NOT_ASSESSED: '#64748b',
};

export default function DashboardPage() {
  const [report, setReport] = useState<KnowledgeGapReport | null>(null);
  const [plan, setPlan] = useState<RevisionPlan | null>(null);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [studentName, setStudentName] = useState('Aarav Mehta');
  const [loading, setLoading] = useState(true);

  // Single doc delete state
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Load student profile
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gapfinder_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.fullName) setStudentName(parsed.fullName);
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

  // Delete single document
  const handleDeleteSingle = async () => {
    if (!docToDelete) return;
    try {
      const res = await fetch(`/api/documents/${docToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Document "${docToDelete.fileName}" was deleted.`);
        setDocToDelete(null);
        await loadDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete all documents
  const handleDeleteAll = async () => {
    try {
      const res = await fetch('/api/documents', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('All uploaded documents have been deleted.');
        setShowDeleteAll(false);
        await loadDashboardData();
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
      : report?.overallMasteryPercentage || 60;

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
      title="Overview"
      subtitle="Comprehensive study intelligence and knowledge gap diagnosis"
      actions={
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
          title="Refresh metrics from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      }
    >
      {statusMsg && (
        <div className="mb-6 p-4 rounded-xl bg-blue-950/60 border border-blue-800/80 text-blue-200 text-xs font-semibold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-blue-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top 4 Dark Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Documents
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {docs.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Uploaded & indexed</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Topics
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {report?.totalTopics || 4}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across syllabus units</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Completed Quizzes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {completedQuizzesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Diagnostic attempts</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {averageQuizScore}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Quiz confidence score</div>
        </div>
      </div>

      {/* Dynamic Topic Status Breakdown Card */}
      <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Knowledge Gap Status Summary
            </h3>
            <p className="text-xs text-slate-400">
              Thresholds: 0–49% Weak • 50–74% Medium • 75–100% Strong • No Attempts: Not Assessed
            </p>
          </div>
          <Link
            href="/gap-report"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            Learning Signal Report →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-900/60 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wider">
                  Weak
                </div>
                <div className="text-xs text-rose-300">0–49% Mastery</div>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-rose-400">
              {report?.weakCount || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-900/60 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
                  Medium
                </div>
                <div className="text-xs text-amber-300">50–74% Mastery</div>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-400">
              {report?.mediumCount || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                  Strong
                </div>
                <div className="text-xs text-emerald-300">75–100% Mastery</div>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {report?.strongCount || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Not Assessed
                </div>
                <div className="text-xs text-slate-500">Pending Quiz</div>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-300">
              {report?.notAssessedCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Topic-Wise Scores */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Topic Mastery Comparison
              </h3>
              <p className="text-xs text-slate-400">
                Scores calculated from student quiz submissions
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-400">Weak</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" />
              <span className="text-slate-400">Medium</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2" />
              <span className="text-slate-400">Strong</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Mastery Score']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    borderColor: '#334155',
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Status Distribution Pie */}
        <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-white">Status Distribution</h3>
          <p className="text-xs text-slate-400 mb-2">Proportion of syllabus mastery</p>

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
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    borderColor: '#334155',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-slate-400 truncate">{d.name}</span>
                <span className="font-bold text-white ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uploaded Documents Workflow Card with Delete All & Single Delete */}
      <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              Course Documents ({docs.length})
            </h3>
            <p className="text-xs text-slate-400">
              Indexed in Supabase pgvector for RAG question answering and quizzes
            </p>
          </div>

          <div className="flex items-center gap-2">
            {docs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteAll(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold border border-rose-800/80 transition-all cursor-pointer"
                title="Delete all uploaded documents"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All</span>
              </button>
            )}

            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>+ Upload New</span>
            </Link>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80 mt-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/60 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>{doc.fileName}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
                      {doc.documentType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {doc.pageCount} Pages • {(doc.fileSize / 1024).toFixed(0)} KB • Processed in pgvector
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full font-semibold border border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Processed</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDocToDelete(doc)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-slate-800 hover:border-rose-800 cursor-pointer"
                  title={`Delete ${doc.fileName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {docs.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">
              No documents uploaded. Click "+ Upload New" to add your syllabus or notes.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Recent Quiz Attempts & Upcoming Revision Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quiz Attempts */}
        <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                Recent Diagnostic Quiz Attempts ({quizSessions.length})
              </h3>
            </div>
            <Link
              href="/quiz"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              Take Quiz →
            </Link>
          </div>

          <div className="space-y-3">
            {quizSessions.slice(0, 4).map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1326] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {sess.topicName || 'Diagnostic Assessment'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {sess.createdAt ? new Date(sess.createdAt).toLocaleDateString() : 'Recent'} • {sess.totalQuestions} Questions • {sess.difficulty}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-white">
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
              <div className="text-center py-6 text-xs text-slate-500">
                No quiz attempts recorded yet. Click "Take Quiz" to begin your first diagnostic test.
              </div>
            )}
          </div>
        </div>

        {/* Revision Tasks */}
        <div className="p-5 rounded-2xl bg-[#10172a] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                Upcoming Revision Tasks
              </h3>
            </div>
            <Link
              href="/revision-plan"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
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
                    ? 'bg-slate-900/40 border-slate-800 opacity-50'
                    : 'bg-[#0d1326] border-slate-800 hover:border-slate-700 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => toggleTask(task.id, task.isCompleted)}
                    className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 cursor-pointer bg-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          task.isCompleted
                            ? 'line-through text-slate-500'
                            : 'text-white'
                        }`}
                      >
                        {task.topicTitle}
                      </span>
                      <span className="text-[10px] bg-blue-950/60 text-blue-400 border border-blue-900/60 px-2 py-0.5 rounded-full font-semibold shrink-0">
                        Day {task.dayNumber} • {task.durationMinutes}m
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {task.activity}
                    </p>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Ref: {task.sourceReference.documentName} (Page {task.sourceReference.page})
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Single Document Deletion */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#10172a] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2">Delete Document</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-white">"{docToDelete.fileName}"</strong>? This will remove the file from storage and remove all associated text chunks from pgvector.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSingle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete All Documents */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#10172a] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-800/80">
            <h3 className="text-base font-bold text-white mb-2">Delete All Documents</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-white">ALL {docs.length} uploaded documents</strong>? This permanently deletes all files from storage and vector database.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteAll(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
