'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gauge,
  FileUp,
  BookOpen,
  Brain,
  Activity,
  MessageSquare,
  CalendarCheck,
  TrendingUp,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface NavItemConfig {
  name: string;
  href: string;
  aliases?: string[];
  icon: any;
  badge?: string | null;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    name: 'Overview',
    href: '/dashboard',
    aliases: ['/overview', '/'],
    icon: Gauge,
  },
  {
    name: 'Upload',
    href: '/upload',
    icon: FileUp,
  },
  {
    name: 'Topics',
    href: '/topics',
    icon: BookOpen,
  },
  {
    name: 'Quiz',
    href: '/quiz',
    icon: Brain,
  },
  {
    name: 'Learning Signal',
    href: '/gap-report',
    aliases: ['/learning-signal'],
    icon: Activity,
    badge: 'Core',
  },
  {
    name: 'AI Assistant',
    href: '/chat',
    aliases: ['/ai-assistant'],
    icon: MessageSquare,
    badge: 'Groq',
  },
  {
    name: 'Revision Plan',
    href: '/revision-plan',
    icon: CalendarCheck,
  },
  {
    name: 'Progress',
    href: '/progress',
    icon: TrendingUp,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('Aarav Mehta');
  const [userEmail, setUserEmail] = useState('demo@gapfinder.ai');
  const [averageConfidence, setAverageConfidence] = useState(60);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Load student profile & dynamic mastery score
    try {
      const stored = localStorage.getItem('gapfinder_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.fullName) setUserName(parsed.fullName);
        if (parsed.email) setUserEmail(parsed.email);
      } else {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.user_metadata?.full_name) {
            setUserName(data.user.user_metadata.full_name);
          }
          if (data?.user?.email) {
            setUserEmail(data.user.email);
          }
        });
      }

      // Fetch dynamic mastery score for the LEARNING SIGNAL card
      fetch('/api/gap-report')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.report?.overallMasteryPercentage !== undefined) {
            setAverageConfidence(data.report.overallMasteryPercentage);
          }
        })
        .catch(() => {});
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('gapfinder_user');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none text-slate-200">
      {/* Brand Header with Blue "G" Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-extrabold text-xl group-hover:scale-105 transition-transform">
            G
          </div>
          <div>
            <div className="font-bold text-white tracking-tight text-lg flex items-center gap-1">
              GapFinder <span className="text-blue-500">AI</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Study Intelligence
            </div>
          </div>
        </Link>
      </div>

      {/* Main Navigation Card Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-[#10172a] border border-slate-800/80 rounded-2xl p-4 shadow-sm">
          {/* Blue NAVIGATION Badge */}
          <div className="mb-4">
            <span className="inline-block bg-blue-600 text-white font-extrabold text-[10px] tracking-widest px-2.5 py-0.5 rounded uppercase shadow-xs">
              NAVIGATION
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.aliases && item.aliases.includes(pathname));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-xs shadow-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* LEARNING SIGNAL Sub-Card at bottom of navigation */}
          <Link
            href="/gap-report"
            className="mt-5 block p-4 rounded-xl bg-[#0b1224] border border-blue-900/40 hover:border-blue-700/60 transition-all group cursor-pointer shadow-inner"
          >
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 flex items-center justify-between">
              <span>LEARNING SIGNAL</span>
              <Activity className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              {averageConfidence}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              Average quiz confidence
            </div>
          </Link>
        </div>
      </div>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0d1326]/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {userName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
}
