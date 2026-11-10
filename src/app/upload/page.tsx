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
  RefreshCw,
} from 'lucide-react';

const DOC_TYPE_META: Record<
  DocumentType,
  { label: string; description: string; icon: any; color: string }
> = {
  syllabus: {
    label: 'Course Syllabus',
    description: 'Defines units, modules, and topic hierarchy.',
    icon: Layers,
    color: 'text-blue-400 bg-blue-950/50 border-blue-800/60',
  },
  textbook: {
    label: 'Textbook Chapters',
    description: 'Detailed textbook content used for RAG grounding.',
    icon: BookOpen,
    color: 'text-purple-400 bg-purple-950/50 border-purple-800/60',
  },
  notes: {
    label: 'Lecture Notes',
    description: 'Professor slides and handwritten or typed notes.',
    icon: FileText,
    color: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/60',
  },
  past_paper: {
    label: 'Past Exam Papers',
    description: 'Previous examination papers for frequency mapping.',
    icon: GraduationCap,
    color: 'text-amber-400 bg-amber-950/50 border-amber-800/60',
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

  // Single Document Deletion State
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Delete All Documents State
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Fetch document list
  const loadDocuments = async () => {
    setLoadingDocs(true);
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
    const validExtensions = ['.pdf', '.txt'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage('Unsupported file format. Please upload a PDF (.pdf) or Text (.txt) file.');
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 5 MB.`);
      return;
    }

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
      setStatusMessage('Extracting text, creating chunks & generating embeddings...');

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
      setSuccessMessage(`"${file.name}" was successfully indexed and is now available to the AI Assistant!`);
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

  // Perform single document deletion
  const confirmDeleteSingle = async () => {
    if (!docToDelete) return;
    setIsDeletingSingle(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/documents/${docToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete document');
      }

      setSuccessMessage(`Document "${docToDelete.fileName}" was deleted from database, storage, and pgvector.`);
      setDocToDelete(null);
      await loadDocuments();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting document.');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Perform delete all documents
  const confirmDeleteAll = async () => {
    setIsDeletingAll(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete all documents');
      }

      setSuccessMessage('All uploaded documents and vector embeddings have been deleted successfully.');
      setShowDeleteAllModal(false);
      await loadDocuments();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting all documents.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <AppLayout
      title="Upload Course Study Materials"
      subtitle="PDF and TXT extraction, text chunking, and pgvector embedding storage (Max 5 MB)"
      actions={
        <button
          onClick={loadDocuments}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      }
    >
      {/* Toast Messages */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-rose-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Type Selector */}
          <div className="p-5 bg-[#10172a] border border-slate-800 rounded-2xl shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
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
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/20 ring-1 ring-blue-500'
                        : 'border-slate-800 hover:border-slate-700 bg-[#0d1326]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        isSelected ? 'text-blue-400' : 'text-slate-500'
                      }`}
                    />
                    <div
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-white' : 'text-slate-300'
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
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-[#10172a] ${
              dragActive
                ? 'border-blue-500 bg-blue-600/10 scale-[0.99]'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mx-auto flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white">
              Upload your {DOC_TYPE_META[selectedType].label}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Drag and drop your PDF or TXT file here. Maximum file size: <strong>5 MB</strong>.
            </p>

            <div className="mt-5">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md shadow-blue-600/20 transition-all active:scale-95">
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
              <div className="mt-6 p-4 rounded-xl bg-blue-950/60 border border-blue-800/80 flex items-center justify-center gap-3 text-blue-200 text-xs font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>
                  Status: <strong>{processingStage}</strong> — {statusMessage}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="p-5 bg-[#10172a] border border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Processing Workflow</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 mt-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-blue-800">1</span>
                <span><strong>Uploaded:</strong> Binary file validated (PDF/TXT &le; 5 MB).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-amber-800">2</span>
                <span><strong>Processing:</strong> Text parsed with page numbers, split into overlapping chunks, 768-dim embeddings generated.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-800">3</span>
                <span><strong>Processed:</strong> Vectors indexed in pgvector, immediately available to the AI Assistant and diagnostic quizzes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-rose-800">4</span>
                <span><strong>Failed:</strong> Document rejected if corrupted, encrypted, or duplicate.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List with Single Delete AND Delete All Buttons */}
      <div className="mt-8 bg-[#10172a] border border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Active Course Materials ({documents.length})
            </h3>
            <p className="text-xs text-slate-400">
              Document Workflow: Document name, classification type, status, and deletion controls
            </p>
          </div>

          {/* Delete All Documents Button */}
          {documents.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold border border-rose-800/80 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              title="Delete all uploaded documents"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Documents</span>
            </button>
          )}
        </div>

        <div className="mt-4 divide-y divide-slate-800/80">
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
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>{doc.fileName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {doc.pageCount} Pages • {(doc.fileSize / 1024).toFixed(0)} KB • Indexed in pgvector
                    </div>
                  </div>
                </div>

                {/* Status + Single Document Delete Button */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full font-semibold border border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Processed</span>
                  </span>

                  {/* Single Document Delete Button with Trash Icon */}
                  <button
                    type="button"
                    onClick={() => setDocToDelete(doc)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-slate-800 hover:border-rose-800 cursor-pointer"
                    title={`Delete "${doc.fileName}"`}
                    aria-label={`Delete ${doc.fileName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {documents.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              No course documents currently uploaded. Drag and drop your syllabus or notes above.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Single Document Deletion */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#10172a] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Document Deletion</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to delete this document?
              <br />
              <strong className="text-white mt-1 block">
                "{docToDelete.fileName}"
              </strong>
              This will remove the file from Supabase Storage and delete all associated text chunks and embeddings from pgvector.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={confirmDeleteSingle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingSingle ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete ALL Documents */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#10172a] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-800/80">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete All Course Documents</h3>
                <p className="text-xs text-rose-300">Warning: Permanent deletion of all indexed files</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-white">ALL {documents.length} uploaded documents</strong>?
              <br />
              This will permanently delete all files from storage and wipe all document chunks and vector embeddings from pgvector.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={confirmDeleteAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting All...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All Documents</span>
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
