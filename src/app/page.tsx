import React from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Search,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Database,
  Cpu,
  GraduationCap,
  Layers,
  ChevronRight,
  BarChart3,
  BookOpen,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Notification Announcement */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-purple-900 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="bg-amber-400 text-indigo-950 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
            Hackathon Live
          </span>
          <span>
            Judges & Evaluators: Quick-access demo student account available with zero setup!
          </span>
          <Link
            href="/login"
            className="underline font-semibold hover:text-indigo-200 transition-colors ml-1"
          >
            Launch Demo →
          </Link>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1">
                GapFinder <span className="text-indigo-600">AI</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                Find What You Don't Know
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#rag-pipeline" className="hover:text-indigo-600 transition-colors">
              RAG Architecture
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#why-gapfinder" className="hover:text-indigo-600 transition-colors">
              Why GapFinder AI?
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition-all active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Diagnostic Engine for College & Exam Preparation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Discover What You Don't Know.{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
              Learn What Matters.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            GapFinder AI analyzes your study materials, identifies your weak topics through diagnostic quizzes, and creates a personalized revision plan to help you prepare smarter.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95 text-base"
            >
              <span>Start Free Diagnosis</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 shadow-sm transition-all text-base group"
            >
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Judge Quick Access (Demo@123)</span>
            </Link>
          </div>

          {/* Hero Visual Preview Card */}
          <div className="mt-16 max-w-5xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden text-left p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Live Diagnostic Assessment
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  CS-301: Machine Learning & Neural Systems
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold">
                  1 Critical Gap Found
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                  1 Topic Mastered
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Weak Card */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                    WEAK (40%)
                  </span>
                  <span className="text-[11px] text-slate-500">Unit 3</span>
                </div>
                <div className="font-bold text-slate-900 mt-2 text-sm">
                  Backpropagation & Activation Functions
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  Struggled with chain-rule derivative derivations & vanishing gradient causes.
                </p>
                <div className="mt-3 text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                  <span>Priority 1 in Revision Plan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Medium Card */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    MEDIUM (62%)
                  </span>
                  <span className="text-[11px] text-slate-500">Unit 2</span>
                </div>
                <div className="font-bold text-slate-900 mt-2 text-sm">
                  Logistic Regression & Regularization
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  Understands sigmoid, but confused L1 diamond vs L2 circle contour geometries.
                </p>
                <div className="mt-3 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <span>Priority 2 in Revision Plan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Strong Card */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    STRONG (92%)
                  </span>
                  <span className="text-[11px] text-slate-500">Unit 1</span>
                </div>
                <div className="font-bold text-slate-900 mt-2 text-sm">
                  Linear Regression & Cost Functions
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  Excellent grasp of Mean Squared Error, gradient descent, and learning rate tuning.
                </p>
                <div className="mt-3 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span>Quick 10-Min Pre-Exam Review</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              The Medical Model For Studying
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              How GapFinder AI Works
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Traditional apps wait for students to ask questions. GapFinder acts like a study doctor: it diagnoses unknown blindspots and prescribes exact study steps.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Upload Study Materials</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Upload your course syllabus, textbook chapters, lecture notes, and past examination papers in PDF or TXT.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Extract Syllabus & Topics</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                AI extracts Units, Topics, and maps past exam questions to identify high-frequency test topics.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Take Diagnostic Quiz</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                AI generates grounded MCQs and short answers from your material. Answers are evaluated with constructive feedback.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">Knowledge Gap & Revision</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Identifies WEAK topics, explains the exact misconceptions, and builds a day-by-day revision schedule with page citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RAG-Powered Learning Section */}
      <section id="rag-pipeline" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200 mb-4">
                <Database className="w-3.5 h-3.5" />
                <span>Zero-Hallucination Retrieval</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Grounded Retrieval-Augmented Generation (RAG)
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Unlike generic chatbots that guess, GapFinder AI strictly isolates vector retrieval from generation. Answers and quizzes are created strictly from your uploaded textbook pages and lecture slides.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Separate Retrieval & Generation</div>
                    <div className="text-xs text-slate-500">
                      Vectors match cosine similarity first; Groq LLaMA 3.3 synthesizes answers only from matching excerpts.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Mandatory Exact Page Citations</div>
                    <div className="text-xs text-slate-500">
                      Every statement lists the exact source file and page: <em>[Source: Textbook, Chapter 4, Page 42]</em>.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Insufficiency Safeguard</div>
                    <div className="text-xs text-slate-500">
                      If the uploaded material does not contain the answer, it returns: <em>"Insufficient information in the uploaded study material."</em>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  RAG Execution Trace
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400">
                  Cosine Match: 0.892
                </span>
              </div>
              <div className="mt-4 space-y-3 text-slate-300">
                <p className="text-indigo-300 font-semibold">
                  &gt; Query: "Why does vanishing gradient occur in Sigmoid?"
                </p>
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                  <span className="text-slate-400 block text-[10px] mb-1">
                    RETRIEVED CHUNK (Page 45, Textbook_Ch4.pdf):
                  </span>
                  "When using saturating functions such as sigmoid, maximum derivative is 0.25. In deep networks, multiplying fractional derivatives across layers causes early gradients to vanish."
                </div>
                <div className="p-3 bg-indigo-950/60 rounded-lg border border-indigo-800/50 text-indigo-100">
                  <span className="text-indigo-400 block text-[10px] mb-1">
                    GROQ GENERATED RESPONSE:
                  </span>
                  "Sigmoidal derivative maxes out at 0.25 at z=0. Repeated chain-rule multiplication decays gradients exponentially. Source: Textbook_Ch4_Deep_Networks.pdf, Page 45."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why GapFinder AI? */}
      <section id="why-gapfinder" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              The Real Student Problem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Why Traditional Study Apps Fail Students
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Students waste 60% of their study time re-reading material they already understand, while high-weightage weak topics remain undiscovered until exam day.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm">
              <div className="flex items-center gap-2 text-rose-700 font-bold mb-3">
                <AlertCircle className="w-5 h-5" />
                <span>Ordinary Chatbots & Flashcards</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Passively wait for students to ask questions they might not even know they need.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Provide generic internet answers disconnected from course syllabus and past exams.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>No objective tracking of whether a student has 40% mastery or 90% mastery.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-bold mb-3">
                <CheckCircle2 className="w-5 h-5" />
                <span>GapFinder AI Diagnostic Engine</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Proactively diagnoses blindspots topic-by-topic before the student even asks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Categorizes topics into WEAK (0-49%), MEDIUM (50-74%), and STRONG (75-100%).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Creates an actionable daily revision plan based on days to exam and past paper frequencies.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base">GapFinder AI</span>
          </div>
          <p className="text-xs text-center sm:text-right">
            Built for AI Internship Assignment & Hackathon by a BTech Computer Science Student.
            <br />
            Next.js App Router • Groq LLaMA 3.3 • Gemini Embeddings • Supabase pgvector.
          </p>
        </div>
      </footer>
    </div>
  );
}
