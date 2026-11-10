'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { TopicBadge } from '@/components/TopicBadge';
import { TopicItem, PastPaperQuestion, KnowledgeGapReport, TopicPerformance } from '@/types';
import {
  Network,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Edit2,
  GraduationCap,
  Sparkles,
  Check,
  X,
  PlayCircle,
  HelpCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [pastPapers, setPastPapers] = useState<PastPaperQuestion[]>([]);
  const [gapReport, setGapReport] = useState<KnowledgeGapReport | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [activeTab, setActiveTab] = useState<'syllabus' | 'past_papers'>('syllabus');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedTopicDetail, setSelectedTopicDetail] = useState<{
    topic: TopicItem;
    performance?: TopicPerformance;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [resTopics, resPapers, resGap] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/past-papers'),
        fetch('/api/gap-report'),
      ]);
      const dataTopics = await resTopics.json();
      const dataPapers = await resPapers.json();
      const dataGap = await resGap.json();

      if (dataTopics.success) setTopics(dataTopics.topics);
      if (dataPapers.success) setPastPapers(dataPapers.questions);
      if (dataGap.success) setGapReport(dataGap.report);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleUnit = (unitNumber: number) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitNumber]: !prev[unitNumber],
    }));
  };

  const startEdit = (topic: TopicItem) => {
    setEditingTopicId(topic.id);
    setEditTitle(topic.title);
  };

  const saveEdit = async (topic: TopicItem) => {
    try {
      const updated = { ...topic, title: editTitle };
      await fetch('/api/topics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedTopic: updated }),
      });
      setTopics((prev) => prev.map((t) => (t.id === topic.id ? updated : t)));
      setEditingTopicId(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Group topics by unitNumber
  const unitsMap = new Map<number, { unitName: string; topics: TopicItem[] }>();
  topics.forEach((t) => {
    if (!unitsMap.has(t.unitNumber)) {
      unitsMap.set(t.unitNumber, { unitName: t.unitName, topics: [] });
    }
    unitsMap.get(t.unitNumber)?.topics.push(t);
  });

  return (
    <AppLayout
      title="Syllabus Topics & Examination Mapping"
      subtitle="Extracted syllabus concepts, mastery levels, quiz attempts, and recurring exam questions"
    >
      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'syllabus'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Syllabus Topics ({topics.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('past_papers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'past_papers'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Past Examination Questions ({pastPapers.length})</span>
        </button>
      </div>

      {activeTab === 'syllabus' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-indigo-950 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Click on any topic to inspect its conceptual explanation, quiz history, and past exam questions.
              </span>
            </div>
          </div>

          {Array.from(unitsMap.entries()).map(([unitNumber, { unitName, topics: unitTopics }]) => {
            const isExpanded = expandedUnits[unitNumber] ?? true;

            return (
              <div
                key={unitNumber}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Unit Header */}
                <button
                  type="button"
                  onClick={() => toggleUnit(unitNumber)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      U{unitNumber}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{unitName}</h3>
                      <div className="text-[11px] text-slate-500">
                        {unitTopics.length} Major Topic(s) • ~25% Syllabus Weightage
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Topics Tree */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-3 space-y-3 bg-slate-50/30">
                    {unitTopics.map((topic) => {
                      const perf = gapReport?.topics.find(
                        (g) => g.topicId === topic.id || g.topicTitle.toLowerCase() === topic.title.toLowerCase()
                      );
                      const status = perf?.status || 'NOT_ASSESSED';
                      const score = perf?.scorePercentage;
                      const attempts = perf?.questionsAttempted || 0;

                      return (
                        <div
                          key={topic.id}
                          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer"
                          onClick={() => setSelectedTopicDetail({ topic, performance: perf })}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              {editingTopicId === topic.id ? (
                                <div
                                  className="flex items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="text-xs font-bold border border-indigo-400 rounded-lg px-2 py-1 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                                  />
                                  <button
                                    onClick={() => saveEdit(topic)}
                                    className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingTopicId(null)}
                                    className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                                    {topic.title}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(topic);
                                    }}
                                    className="text-slate-400 hover:text-indigo-600 p-0.5"
                                    title="Edit topic title"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {topic.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {topic.description}
                                </p>
                              )}

                              {/* Subtopics */}
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <div className="mt-2.5 pl-3 border-l-2 border-indigo-200 space-y-1">
                                  {topic.subtopics.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="text-xs text-slate-600 flex items-center gap-1.5"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                      <span>{sub.title}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Status Pill & Attempt Count */}
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                              <TopicBadge status={status} score={score} size="md" />
                              <span className="text-[10px] text-slate-400">
                                {attempts > 0 ? `${attempts} questions attempted` : 'Not assessed yet'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Past Examination Papers Mapping */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-purple-950 font-medium">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Questions extracted from 2022–2023 University examinations, mapped to topics to determine recurrence weightage.
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {pastPapers.map((q) => (
                <div key={q.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {q.mappedTopicName || 'Unmapped'}
                      </span>
                      <span className="text-[11px] text-slate-500">{q.unitName}</span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {q.marks} Marks
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                        <span>Appeared {q.frequencyCount}x</span>
                      </span>
                      <span className="text-[11px] text-slate-400">{q.year}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                    "{q.questionText}"
                  </p>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                    <span>Source: {q.sourceReference}</span>
                    <span>•</span>
                    <span>Confidence: {((q.confidenceScore || 0.8) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Topic Explanation Modal */}
      {selectedTopicDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {selectedTopicDetail.topic.unitName}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {selectedTopicDetail.topic.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTopicDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Concept Overview:</span>
                <p className="text-slate-600 leading-relaxed">
                  {selectedTopicDetail.topic.description ||
                    'Detailed theoretical and numerical principles covered in this course module.'}
                </p>
              </div>

              {/* Mastery Diagnosis */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Mastery Assessment:</span>
                  <TopicBadge
                    status={selectedTopicDetail.performance?.status || 'NOT_ASSESSED'}
                    score={selectedTopicDetail.performance?.scorePercentage}
                    size="sm"
                  />
                </div>
                {selectedTopicDetail.performance ? (
                  <div className="text-slate-600 space-y-1">
                    <div>
                      <strong>Score:</strong> {selectedTopicDetail.performance.scorePercentage}% (
                      {selectedTopicDetail.performance.correctAnswers}/
                      {selectedTopicDetail.performance.questionsAttempted} correct)
                    </div>
                    <div>
                      <strong>Diagnosis:</strong> {selectedTopicDetail.performance.gapReason}
                    </div>
                    <div>
                      <strong>Recommendation:</strong>{' '}
                      {selectedTopicDetail.performance.recommendation}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500">
                    You have not taken a diagnostic quiz for this topic yet. Take a test to establish your baseline.
                  </div>
                )}
              </div>

              {/* Subtopics */}
              {selectedTopicDetail.topic.subtopics &&
                selectedTopicDetail.topic.subtopics.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Module Subtopics:</span>
                    <ul className="list-disc pl-5 text-slate-600 space-y-1">
                      {selectedTopicDetail.topic.subtopics.map((s) => (
                        <li key={s.id}>{s.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTopicDetail(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <Link
                href={`/quiz?topicId=${selectedTopicDetail.topic.id}&topicTitle=${encodeURIComponent(
                  selectedTopicDetail.topic.title
                )}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Take Diagnostic Quiz on This Topic</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
