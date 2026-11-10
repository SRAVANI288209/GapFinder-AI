/**
 * GapFinder AI - Core TypeScript Definitions
 * Find What the Student Doesn't Know
 */

export type DocumentType = 'syllabus' | 'textbook' | 'notes' | 'past_paper';

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type GapStatus = 'WEAK' | 'MEDIUM' | 'STRONG' | 'NOT_ASSESSED';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  subjectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: DocumentType;
  pageCount: number;
  extractedTextSnippet?: string;
  status: 'processing' | 'ready' | 'error';
  createdAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  pageNumber: number;
  chunkIndex: number;
  embedding?: number[];
  metadata: {
    fileName: string;
    documentType: DocumentType;
    subjectId: string;
    tokenCount?: number;
  };
}

export interface TopicItem {
  id: string;
  userId: string;
  subjectId: string;
  unitNumber: number;
  unitName: string;
  title: string;
  description?: string;
  parentTopicId?: string | null;
  examWeightage?: number; // e.g. estimated % in syllabus
  orderIndex: number;
  subtopics?: TopicItem[];
}

export interface PastPaperQuestion {
  id: string;
  userId: string;
  subjectId: string;
  questionText: string;
  year?: string;
  marks?: number;
  mappedTopicId?: string | null;
  mappedTopicName?: string;
  unitName?: string;
  frequencyCount: number;
  confidenceScore?: number; // 0.0 - 1.0
  sourceReference?: string;
}

export interface QuizQuestion {
  id: string;
  quizSessionId?: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[]; // 4 choices for MCQ, 2 for True/False
  correctAnswer: string;
  explanation: string;
  topicId: string;
  topicName: string;
  difficulty: DifficultyLevel;
  sourceDocument: string;
  pageNumber: number;
  supportingSourceSnippet: string;
}

export interface StudentAnswer {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean;
  scoreObtained: number;
  maxScore: number;
  evaluationExplanation: string;
  topicId: string;
  topicName: string;
  sourceCitation: {
    source: string;
    page: number;
    quote?: string;
  };
}

export interface QuizSession {
  id: string;
  userId: string;
  subjectId: string;
  topicId?: string;
  topicName?: string;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  scorePercentage: number;
  questions: QuizQuestion[];
  answers: StudentAnswer[];
  createdAt: string;
}

export interface TopicPerformance {
  topicId: string;
  topicTitle: string;
  unitName: string;
  questionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercentage: number;
  status: GapStatus;
  gapReason: string;
  recommendation: string;
  examFrequency: number; // calculated from past papers
  history: {
    quizDate: string;
    score: number;
  }[];
}

export interface KnowledgeGapReport {
  subjectId: string;
  subjectName: string;
  totalTopics: number;
  assessedTopics: number;
  weakCount: number;
  mediumCount: number;
  strongCount: number;
  notAssessedCount: number;
  topics: TopicPerformance[];
  overallMasteryPercentage: number;
  generatedAt: string;
}

export interface RevisionTask {
  id: string;
  revisionPlanId: string;
  dayNumber: number;
  topicId: string;
  topicTitle: string;
  focusArea: string;
  durationMinutes: number;
  activity: string; // e.g. "Read textbook and solve 10 questions"
  learningObjective: string;
  sourceReference: {
    documentName: string;
    page: number;
  };
  isCompleted: boolean;
}

export interface RevisionPlan {
  id: string;
  userId: string;
  subjectId: string;
  daysRemaining: number;
  hoursPerDay: number;
  totalTasks: number;
  completedTasks: number;
  tasks: RevisionTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: {
    source: string;
    page: number;
    textExcerpt?: string;
  }[];
  timestamp: string;
}

export interface RetrievalResult {
  content: string;
  pageNumber: number;
  documentName: string;
  documentType: DocumentType;
  similarity: number;
}
