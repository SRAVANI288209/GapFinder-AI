'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface NavItemConfig {
  name: string;
  href: string;
  aliases?: string[];
  icon: any;
  badge: string | null;
  highlight?: boolean;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    name: 'Overview',
    href: '/dashboard',
    aliases: ['/overview'],
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Upload',
    href: '/upload',
    icon: UploadCloud,
    badge: null,
  },
  {
    name: 'Topics',
    href: '/topics',
    icon: Network,
    badge: 'Tree',
  },
  {
    name: 'Quiz',
    href: '/quiz',
    icon: HelpCircle,
    badge: 'AI',
  },
  {
    name: 'Learning Signal',
    href: '/gap-report',
    aliases: ['/learning-signal'],
    icon: FileSearch,
    badge: 'Core',
    highlight: true,
  },
  {
    name: 'AI Assistant',
    href: '/chat',
    aliases: ['/ai-assistant'],
    icon: MessageSquareText,
    badge: 'Groq',
    highlight: true,
  },
  {
    name: 'Revision Plan',
    href: '/revision-plan',
    icon: CalendarCheck,
    badge: null,
  },
  {
    name: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('Student');
  const [userEmail, setUserEmail] = useState('demo@gapfinder.ai');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Dynamically retrieve authenticated student details
    try {
      const stored = localStorage.getItem('gapfinder_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.fullName) setUserName(parsed.fullName);
        if (parsed.email) setUserEmail(parsed.email);
      } else {
        // Check Supabase session
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setUserEmail(data.user.email || 'student@gapfinder.ai');
            const metaName = data.user.user_metadata?.full_name;
            if (metaName) setUserName(metaName);
          }
        });
      }
    } catch (e) {
      console.warn('Could not read user profile:', e);
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

  // Get initials for avatar
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'ST';

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
          const isActive =
            pathname === item.href || (item.aliases && item.aliases.includes(pathname));
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
                <span className="font-semibold">{item.name}</span>
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

      {/* User Footer & Dynamic Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm shrink-0">
              {initials}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {userName}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Log out of student account"
            aria-label="Log out"
          >
            <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
}
