'use client';

import React, { useState } from 'react';
import { Sparkles, X, Info } from 'lucide-react';

export function DemoBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-purple-900 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-sm transition-all border-b border-indigo-700/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold text-xs tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            HACKATHON DEMO MODE
          </span>
          <span className="text-indigo-100">
            Judge Quick Access: Logged in as <strong className="text-white underline decoration-indigo-400">demo@gapfinder.ai</strong>. 
            Pre-loaded with BTech CS Machine Learning course syllabus, notes & past papers.
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-indigo-300 hover:text-white p-1 rounded-md transition-colors"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
