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
  AlertTriangle,
  X,
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
  const [processingStage, setProcessingStage] = useState<'Uploaded' | 'Processing' | 'Processed' | 'Failed' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Deletion Confirmation Modal State
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    // 1. Validation for file format
    const validExtensions = ['.pdf', '.txt'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage('Unsupported file format. Please upload a PDF (.pdf) or Text (.txt) file.');
      return;
    }

    // 2. Strict 5 MB maximum file size limit
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 5 MB.`);
      return;
    }

    // 3. Prevent duplicate uploads
    const isDuplicate = documents.some(
      (d) => d.fileName.toLowerCase() === file.name.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage(`"${file.name}" has already been uploaded. Please rename or delete the previous version before uploading again.`);
      return;
    }

    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setProcessingStage('Uploaded');
    setStatusMessage('Document uploaded. Preparing text extraction...');

    try {
      setProcessingStage('Processing');
      setStatusMessage('Extracting text & page markers from document...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedType);
      formData.append('userId', 'demo-student-uuid-101');
      formData.append('subjectId', 'subj-cs301');

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload processing failed');
      }

      setProcessingStage('Processed');
      setSuccessMessage(`"${file.name}" successfully parsed, chunked, and embedded into pgvector!`);
      setStatusMessage('');
      await loadDocuments();
    } catch (err: any) {
      setProcessingStage('Failed');
      setErrorMessage(err.message || 'Error processing document.');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setProcessingStage(null);
      }, 5000);
    }
  };

  // Perform actual deletion from database, storage, and pgvector
  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/documents/${docToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete document from storage');
      }

      setSuccessMessage(`Document "${docToDelete.fileName}" was deleted from database, storage, and vector index.`);
      setDocToDelete(null);
      await loadDocuments();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting document.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout
      title="Upload Course Study Materials"
      subtitle="PDF and TXT extraction, text chunking, and pgvector embedding storage (Max 5 MB)"
    >
      {/* Toast Messages */}
      {successMessage && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-700 hover:text-rose-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              Drag and drop your PDF or TXT file here. Maximum file size: <strong>5 MB</strong>.
            </p>

            <div className="mt-5">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm cursor-pointer shadow-sm shadow-indigo-200 transition-all active:scale-95">
                <span>Select File from Device (Max 5MB)</span>
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
                <span>
                  Status: <strong>{processingStage}</strong> — {statusMessage}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Processing Stages</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 mt-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span><strong>Uploaded:</strong> Binary file validated and accepted.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span><strong>Processing:</strong> Text extraction, sentence-boundary chunking, and vector embedding generation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <span><strong>Processed:</strong> Vectors stored in pgvector, ready for AI Assistant and quizzes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-700 font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
                <span><strong>Failed:</strong> Document rejected if encrypted, corrupted, or larger than 5 MB.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List with Delete Button */}
      <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Course Materials ({documents.length})
            </h3>
            <p className="text-xs text-slate-500">
              Document Workflow: Document name, classification type, processing status, and deletion
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

                {/* Status + Delete Button */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Processed</span>
                  </span>

                  {/* Delete Button with Trash Icon */}
                  <button
                    type="button"
                    onClick={() => setDocToDelete(doc)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                    title={`Delete "${doc.fileName}"`}
                    aria-label={`Delete ${doc.fileName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Document Deletion</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete this document?
              <br />
              <strong className="text-slate-900 mt-1 block">
                "{docToDelete.fileName}"
              </strong>
              This will remove the file from Supabase Storage and remove all associated text chunks and embeddings from the vector database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
