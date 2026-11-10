'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  PlayCircle,
  Upload,
  Bot,
  HelpCircle,
  Bell,
  Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const [studentName, setStudentName] = useState('Aarav Mehta');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gapfinder_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.fullName) setStudentName(parsed.fullName);
      } else {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.user_metadata?.full_name) {
            setStudentName(data.user.user_metadata.full_name);
          }
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  return (
    <header className="bg-[#0a0f1d] border-b border-slate-800/80 sticky top-0 z-20">
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left Side: Welcome Badge + Page Title */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Blue G Logo Icon */}
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
              G
            </div>
            {/* Blue Background Highlight on Welcome Message */}
            <span className="inline-block bg-blue-600 text-white font-extrabold text-sm sm:text-base px-3 py-1 rounded-md shadow-xs">
              Welcome back, {studentName}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <span className="hidden md:inline-block text-xs text-slate-400 font-normal">
                • {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Working Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {actions}

          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700/60 shadow-xs transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4 text-blue-400" />
            <span>AI Assistant</span>
          </Link>

          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Take Diagnostic Quiz</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
