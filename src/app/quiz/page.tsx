'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { TopicBadge } from '@/components/TopicBadge';
import { DifficultyLevel, QuizQuestion, StudentAnswer, TopicItem } from '@/types';
import {
  HelpCircle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Award,
  RefreshCw,
  Loader2,
  FileSearch,
} from 'lucide-react';

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <AppLayout
          title="Diagnostic Knowledge Quiz"
          subtitle="AI-generated questions grounded in your course materials with automatic gap diagnosis"
        >
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-xs font-semibold">Loading Diagnostic Quiz...</span>
          </div>
        </AppLayout>
      }
    >
      <QuizComponent />
    </Suspense>
  );
}

function QuizComponent() {
  const searchParams = useSearchParams();
  const initialTopicId = searchParams.get('topicId') || '';
  const initialTopicTitle = searchParams.get('topicTitle') || '';

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState(initialTopicTitle);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [questionCount, setQuestionCount] = useState(3);

  // Quiz state: 'config' | 'in_progress' | 'results'
  const [quizState, setQuizState] = useState<'config' | 'in_progress' | 'results'>('config');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [evaluatedResults, setEvaluatedResults] = useState<StudentAnswer[]>([]);
  const [finalScorePct, setFinalScorePct] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load syllabus topics
  useEffect(() => {
    fetch('/api/topics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.topics.length > 0) {
          setTopics(data.topics);
          if (!selectedTopicId) {
            setSelectedTopicId(data.topics[0].id);
            setSelectedTopicTitle(data.topics[0].title);
          }
        }
      })
      .catch((e) => console.error(e));
  }, [selectedTopicId]);

  // Start Diagnostic Quiz
  const handleStartQuiz = async () => {
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId,
          topicTitle: selectedTopicTitle,
          difficulty,
          questionCount,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      setQuestions(data._serverVault || data.questions);
      setCurrentQuestionIndex(0);
      setStudentAnswers({});
      setQuizState('in_progress');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not generate quiz. Check uploaded materials.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Record student answer selection or text input
  const handleAnswerChange = (questionId: string, answer: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Submit and evaluate quiz
  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const submitted = questions.map((q) => ({
        questionId: q.id,
        studentAnswer: studentAnswers[q.id] || '',
      }));

      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId,
          topicName: selectedTopicTitle,
          difficulty,
          questions,
          submittedAnswers: submitted,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEvaluatedResults(data.evaluatedAnswers);
        setFinalScorePct(data.scorePercentage);
        setQuizState('results');
      }
    } catch (err: any) {
      console.error('Quiz evaluation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const progressPct =
    questions.length > 0
      ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
      : 0;

  return (
    <AppLayout
      title="Diagnostic Knowledge Quiz"
      subtitle="AI-generated questions grounded in your course materials with automatic gap diagnosis"
    >
      {/* 1. Configuration Screen */}
      {quizState === 'config' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configure Diagnostic Test</h2>
              <p className="text-xs text-slate-500">
                Select topic and difficulty. Questions are generated strictly from indexed chunks.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-6 space-y-5">
            {/* Topic Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Syllabus Topic to Assess
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => {
                  setSelectedTopicId(e.target.value);
                  const matched = topics.find((t) => t.id === e.target.value);
                  if (matched) setSelectedTopicTitle(matched.title);
                }}
                className="w-full text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50/50 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.unitName} → {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-3 px-3 rounded-xl border text-center capitalize text-xs sm:text-sm font-bold transition-all ${
                      difficulty === level
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Number of Diagnostic Questions
              </label>
              <div className="flex items-center gap-3">
                {[2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`flex-1 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                      questionCount === cnt
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-98 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Retrieving Chunks & Generating Questions...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    <span>Begin Diagnostic Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. In-Progress Quiz Screen */}
      {quizState === 'in_progress' && currentQ && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Header & Progress */}
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize font-medium">
                {currentQ.difficulty}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Topic: {currentQ.topicName}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="my-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.questionText}
            </h3>

            {/* MCQ Options */}
            {currentQ.questionType === 'mcq' && currentQ.options && (
              <div className="mt-5 space-y-3">
                {currentQ.options.map((option, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx] || '';
                  const isSelected =
                    studentAnswers[currentQ.id] === letter ||
                    studentAnswers[currentQ.id] === option;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswerChange(currentQ.id, letter)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="pt-0.5">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short-Answer Free Text Input */}
            {currentQ.questionType === 'short_answer' && (
              <div className="mt-5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Your Answer (Evaluated against course textbook with partial marks):
                </label>
                <textarea
                  rows={4}
                  value={studentAnswers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  placeholder="Explain your reasoning here. Include relevant principles, formulas, and definitions..."
                  className="w-full text-xs sm:text-sm p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50/50"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Answers with Groq...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Diagnose Knowledge Gaps</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Evaluation & Results Screen */}
      {quizState === 'results' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Results Summary Hero */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Diagnostic Quiz Results
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Topic: {selectedTopicTitle}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {finalScorePct}%
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {finalScorePct < 50
                      ? 'WEAK DIAGNOSIS'
                      : finalScorePct < 75
                      ? 'MEDIUM MASTERY'
                      : 'STRONG MASTERY'}
                  </div>
                </div>

                <TopicBadge
                  status={
                    finalScorePct < 50
                      ? 'WEAK'
                      : finalScorePct < 75
                      ? 'MEDIUM'
                      : 'STRONG'
                  }
                  size="lg"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/gap-report"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all"
              >
                <FileSearch className="w-4 h-4" />
                <span>View Updated Knowledge Gap Diagnosis →</span>
              </Link>

              <button
                type="button"
                onClick={() => setQuizState('config')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Take Another Test</span>
              </button>
            </div>
          </div>

          {/* Question-by-Question Detailed Feedback */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 px-1">
              Detailed Answer Evaluation & Explanations ({evaluatedResults.length})
            </h3>

            {evaluatedResults.map((result, idx) => {
              const q = questions[idx];
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all ${
                    result.isCorrect
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Question #{idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        result.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Score: {result.scoreObtained} / {result.maxScore}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 mb-3">
                    {q?.questionText}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="font-bold text-slate-500 block mb-0.5">
                        Your Submitted Answer:
                      </span>
                      <span className="text-slate-800 font-medium">
                        {result.studentAnswer || '[No Answer]'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="font-bold text-emerald-700 block mb-0.5">
                        Reference Correct Answer:
                      </span>
                      <span className="text-slate-800 font-medium">
                        {q?.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Explanation */}
                  <div className="p-3 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-700 leading-relaxed mb-2">
                    <span className="font-bold text-indigo-700 block mb-0.5">
                      Pedagogical Evaluation:
                    </span>
                    {result.evaluationExplanation}
                  </div>

                  {/* Grounded Citation */}
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-200/60">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      Grounded Citation: <strong>{result.sourceCitation.source}</strong> (Page{' '}
                      {result.sourceCitation.page})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
