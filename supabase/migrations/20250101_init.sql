-- ============================================================
-- GapFinder AI: PostgreSQL Schema with pgvector
-- Run this migration in Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Documents Table (Metadata for syllabus, textbooks, notes, past papers)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  document_type TEXT NOT NULL CHECK (document_type IN ('syllabus', 'textbook', 'notes', 'past_paper')),
  page_count INT DEFAULT 1,
  extracted_text_snippet TEXT,
  status TEXT DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Document Chunks Table with Vector Embeddings (768 dimensions for Gemini text-embedding-004)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INT NOT NULL DEFAULT 1,
  chunk_index INT NOT NULL DEFAULT 0,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast cosine similarity vector search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON public.document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Syllabus Topics Hierarchy Table
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number INT NOT NULL DEFAULT 1,
  unit_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  parent_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  exam_weightage NUMERIC(5,2) DEFAULT 0.0,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Past Paper Questions Table
CREATE TABLE IF NOT EXISTS public.past_paper_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  year TEXT,
  marks INT,
  mapped_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  unit_name TEXT,
  frequency_count INT NOT NULL DEFAULT 1,
  confidence_score NUMERIC(3,2) DEFAULT 0.8,
  source_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Diagnostic Quiz Sessions Table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  topic_name TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  total_questions INT NOT NULL,
  score_percentage NUMERIC(5,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Generated Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'short_answer')),
  options JSONB, -- Array of string choices for MCQ
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  topic_name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  source_document TEXT NOT NULL,
  page_number INT NOT NULL,
  supporting_source_snippet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Student Answers & AI Evaluation
CREATE TABLE IF NOT EXISTS public.student_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  student_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  score_obtained NUMERIC(4,2) NOT NULL,
  max_score NUMERIC(4,2) NOT NULL,
  evaluation_explanation TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  topic_name TEXT NOT NULL,
  source_citation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Topic Performance & Gap Diagnosis Table
CREATE TABLE IF NOT EXISTS public.topic_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  questions_attempted INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  score_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL CHECK (status IN ('WEAK', 'MEDIUM', 'STRONG', 'NOT_ASSESSED')),
  gap_reason TEXT,
  recommendation TEXT,
  exam_frequency INT DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb,
  last_evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, topic_id)
);

-- 11. Revision Plans Table
CREATE TABLE IF NOT EXISTS public.revision_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  days_remaining INT NOT NULL,
  hours_per_day NUMERIC(3,1) NOT NULL,
  total_tasks INT NOT NULL DEFAULT 0,
  completed_tasks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Revision Tasks Table
CREATE TABLE IF NOT EXISTS public.revision_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_plan_id UUID NOT NULL REFERENCES public.revision_plans(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  topic_title TEXT NOT NULL,
  focus_area TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  activity TEXT NOT NULL,
  learning_objective TEXT NOT NULL,
  source_reference JSONB,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- 13. Chat History for RAG Study Buddy
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Supabase Row Level Security (RLS)
-- Protect user data isolation
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_paper_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for authenticated users accessing their own records
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own subjects" ON public.subjects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own documents" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own chunks" ON public.document_chunks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own topics" ON public.topics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own past papers" ON public.past_paper_questions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quiz sessions" ON public.quiz_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage questions from own sessions" ON public.questions FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.quiz_sessions WHERE quiz_sessions.id = questions.quiz_session_id AND quiz_sessions.user_id = auth.uid()));

CREATE POLICY "Users can manage answers from own sessions" ON public.student_answers FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.quiz_sessions WHERE quiz_sessions.id = student_answers.quiz_session_id AND quiz_sessions.user_id = auth.uid()));

CREATE POLICY "Users can manage own topic performance" ON public.topic_performance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own revision plans" ON public.revision_plans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage tasks from own plans" ON public.revision_tasks FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.revision_plans WHERE revision_plans.id = revision_tasks.revision_plan_id AND revision_plans.user_id = auth.uid()));

CREATE POLICY "Users can manage own chat" ON public.chat_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Vector Similarity Match RPC Function
-- Used for RAG retrieval
-- ============================================================
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  page_number int,
  chunk_index int,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.page_number,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.user_id = filter_user_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to automatically create a profile entry when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Student'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
