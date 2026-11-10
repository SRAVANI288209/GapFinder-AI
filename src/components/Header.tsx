'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  PlayCircle,
  HelpCircle,
  Bell,
  Search,
  BookMarked,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" />
              RAG Active
            </span>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-200 transition-all active:scale-95"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Take Diagnostic Quiz</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
