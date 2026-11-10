'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { TopicItem, PastPaperQuestion } from '@/types';
import {
  Network,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Edit2,
  Plus,
  Trash2,
  GraduationCap,
  Sparkles,
  Layers,
  Check,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [pastPapers, setPastPapers] = useState<PastPaperQuestion[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [activeTab, setActiveTab] = useState<'syllabus' | 'past_papers'>('syllabus');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [resTopics, resPapers] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/past-papers'),
      ]);
      const dataTopics = await resTopics.json();
      const dataPapers = await resPapers.json();

      if (dataTopics.success) setTopics(dataTopics.topics);
      if (dataPapers.success) setPastPapers(dataPapers.questions);
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
      title="Syllabus Hierarchy & Past-Paper Mapping"
      subtitle="Extract course units, subtopics, and calculate recurring exam question frequencies"
    >
      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'syllabus'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Syllabus Topic Map ({topics.length} Topics)</span>
        </button>

        <button
          onClick={() => setActiveTab('past_papers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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
                Hierarchical topics extracted from official syllabus. You can edit topic names if required.
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
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
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
                    {unitTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {editingTopicId === topic.id ? (
                              <div className="flex items-center gap-2">
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
                                <span className="text-xs font-bold text-slate-900">
                                  {topic.title}
                                </span>
                                <button
                                  onClick={() => startEdit(topic)}
                                  className="text-slate-400 hover:text-indigo-600 p-0.5"
                                  title="Edit topic title"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {topic.description && (
                              <p className="text-xs text-slate-500 mt-1">
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

                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              Order #{topic.orderIndex}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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
    </AppLayout>
  );
}
