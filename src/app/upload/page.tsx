'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { DocumentRecord, DocumentType } from '@/types';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';

const DOC_TYPE_META: Record<
  DocumentType,
  { label: string; description: string; icon: any; color: string }
> = {
  syllabus: {
    label: 'Course Syllabus',
    description: 'Defines units, modules, and topic hierarchy.',
    icon: Layers,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  textbook: {
    label: 'Textbook Chapters',
    description: 'Detailed textbook content used for RAG grounding.',
    icon: BookOpen,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  notes: {
    label: 'Lecture Notes',
    description: 'Professor slides and handwritten or typed notes.',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  past_paper: {
    label: 'Past Exam Papers',
    description: 'Previous examination papers for frequency mapping.',
    icon: GraduationCap,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
};

export default function UploadPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType>('textbook');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Fetch document list
  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    // Validation
    const validExtensions = ['.pdf', '.txt'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage('Please upload a PDF (.pdf) or Text (.txt) file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit.');
      return;
    }

    setUploading(true);
    setErrorMessage('');
    setStatusMessage('1/4 Extracting document text & page metadata...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedType);
      formData.append('userId', 'demo-student-uuid-101');
      formData.append('subjectId', 'subj-cs301');

      setTimeout(() => setStatusMessage('2/4 Chunking text with contextual overlap...'), 800);
      setTimeout(() => setStatusMessage('3/4 Generating 768-dim embeddings via Gemini API...'), 1600);
      setTimeout(() => setStatusMessage('4/4 Persisting vectors to Supabase pgvector...'), 2400);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setStatusMessage('Document indexed and ready for RAG retrieval!');
      await loadDocuments();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing document.');
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document from the RAG index?')) return;
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      await loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout
      title="Upload Course Study Materials"
      subtitle="PDF and TXT extraction, text chunking, and pgvector embedding storage"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Type Selector */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Step 1: Select Document Classification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(DOC_TYPE_META) as DocumentType[]).map((type) => {
                const meta = DOC_TYPE_META[type];
                const Icon = meta.icon;
                const isSelected = selectedType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        isSelected ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <div
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-indigo-950' : 'text-slate-800'
                      }`}
                    >
                      {meta.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-white ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/40 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Upload your {DOC_TYPE_META[selectedType].label}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Drag and drop your PDF or TXT file here, or browse from your computer. Max 15MB.
            </p>

            <div className="mt-5">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm cursor-pointer shadow-sm shadow-indigo-200 transition-all active:scale-95">
                <span>Select File from Device</span>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {uploading && (
              <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center gap-3 text-indigo-900 text-xs font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{statusMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4" />
              <span>What Material Should You Upload?</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 mt-3 leading-relaxed">
              <li>
                <strong>1. Syllabus PDF:</strong> Allows AI to build your complete Unit → Topic hierarchy and detect unassessed units.
              </li>
              <li>
                <strong>2. Textbook Chapters:</strong> Powers exact page citations when answering questions and grading diagnostic quizzes.
              </li>
              <li>
                <strong>3. Lecture Notes:</strong> Highlights professor-specific emphasis, abbreviations, and derivation formats.
              </li>
              <li>
                <strong>4. Past Question Papers:</strong> Maps recurring questions to identify high-frequency exam topics.
              </li>
            </ul>
          </div>

          <div className="p-5 bg-slate-900 text-slate-200 rounded-2xl shadow-sm text-xs font-mono">
            <span className="text-indigo-400 font-bold block mb-1">
              RAG Ingestion Pipeline
            </span>
            <div className="text-slate-400 space-y-1 mt-2 text-[11px]">
              <div>1. PDF Parsing via pdf-parse</div>
              <div>2. Whitespace & ASCII normalization</div>
              <div>3. Sentence-boundary chunking (~1200 chars)</div>
              <div>4. Gemini text-embedding-004 (768d)</div>
              <div>5. Supabase pgvector storage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Course Materials ({documents.length})
            </h3>
            <p className="text-xs text-slate-500">
              These files feed the RAG vector database for quizzes and chatbot citations
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {documents.map((doc) => {
            const meta = DOC_TYPE_META[doc.documentType] || DOC_TYPE_META.textbook;
            const Icon = meta.icon;

            return (
              <div
                key={doc.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{doc.fileName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {doc.pageCount} Pages • {(doc.fileSize / 1024).toFixed(0)} KB • Indexed in pgvector
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Indexed</span>
                  </span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
