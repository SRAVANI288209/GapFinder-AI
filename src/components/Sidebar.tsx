'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UploadCloud,
  Network,
  HelpCircle,
  FileSearch,
  CalendarCheck,
  TrendingUp,
  MessageSquareText,
  LogOut,
  BrainCircuit,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Upload Material',
    href: '/upload',
    icon: UploadCloud,
    badge: null,
  },
  {
    name: 'Syllabus & Topic Map',
    href: '/topics',
    icon: Network,
    badge: 'Tree',
  },
  {
    name: 'Diagnostic Quiz',
    href: '/quiz',
    icon: HelpCircle,
    badge: 'AI',
  },
  {
    name: 'Knowledge Gap Report',
    href: '/gap-report',
    icon: FileSearch,
    badge: 'Core',
    highlight: true,
  },
  {
    name: 'Personalized Revision',
    href: '/revision-plan',
    icon: CalendarCheck,
    badge: null,
  },
  {
    name: 'Progress Analytics',
    href: '/progress',
    icon: TrendingUp,
    badge: null,
  },
  {
    name: 'RAG Study Buddy',
    href: '/chat',
    icon: MessageSquareText,
    badge: 'Citations',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-lg flex items-center gap-1">
              GapFinder <span className="text-indigo-600">AI</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
              Diagnostic Learning
            </div>
          </div>
        </Link>
      </div>

      {/* Active Subject Selector Card */}
      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
            Current Course
          </span>
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
            ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-800 truncate">
              CS-301: Machine Learning
            </div>
            <div className="text-[10px] text-slate-400">Semester VI • 4 Units</div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.highlight
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
              AS
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-900 truncate">
                Arjun Sharma
              </div>
              <div className="text-[10px] text-slate-500 truncate">demo@gapfinder.ai</div>
            </div>
          </div>
          <Link
            href="/login"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Switch User / Logout"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
