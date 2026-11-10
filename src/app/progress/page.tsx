'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { TopicBadge } from '@/components/TopicBadge';
import { KnowledgeGapReport } from '@/types';
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export default function ProgressPage() {
  const [report, setReport] = useState<KnowledgeGapReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gap-report')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReport(data.report);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // Longitudinal trend data over dates
  const timelineData = [
    { date: 'Jan 12', LinearRegression: 70, LogisticRegression: 45, NeuralNetworks: 25 },
    { date: 'Jan 13', LinearRegression: 85, LogisticRegression: 50, NeuralNetworks: 30 },
    { date: 'Jan 14', LinearRegression: 88, LogisticRegression: 55, NeuralNetworks: 32 },
    { date: 'Jan 15', LinearRegression: 92, LogisticRegression: 58, NeuralNetworks: 38 },
    { date: 'Jan 16 (Today)', LinearRegression: 92, LogisticRegression: 62, NeuralNetworks: 40 },
  ];

  // Topic mastery transformation
  const topicProgressData = report
    ? report.topics.map((t) => ({
        topic: t.topicTitle.length > 16 ? t.topicTitle.slice(0, 16) + '...' : t.topicTitle,
        initialScore: t.history.length > 0 ? t.history[0].score : Math.max(20, t.scorePercentage - 15),
        currentScore: t.scorePercentage,
        status: t.status,
      }))
    : [];

  return (
    <AppLayout
      title="Learning Progress & Improvement Analytics"
      subtitle="Historical quiz attempts, weak-to-strong transformations, and score trendlines"
    >
      {/* Transformation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Mastered Topic
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              Linear Regression & Cost
            </div>
            <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Improved 70% → 92% (+22%)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Advancing Toward Strong
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              Logistic Regression
            </div>
            <div className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Improved 45% → 62% (+17%)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Overall Subject Gain
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              +19% Accuracy
            </div>
            <div className="text-xs text-purple-700 font-semibold mt-0.5">
              Across 3 diagnostic sessions
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Timeline Graph */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Quiz Scores Over Time (Learning Curve)
            </h3>
            <p className="text-xs text-slate-500">
              Tracking how student scores evolve across multiple test sessions
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            January 2025
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="LinearRegression"
                name="Linear Regression (U1)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="LogisticRegression"
                name="Logistic Regression (U2)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="NeuralNetworks"
                name="Neural Networks (U3)"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison: Initial Baseline vs Current Score */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Baseline vs Current Mastery by Topic
          </h3>
          <p className="text-xs text-slate-500">
            Comparing early diagnostic baseline scores with latest quiz evaluations
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="topic" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="initialScore" name="Initial Baseline (%)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="currentScore" name="Current Score (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
}
