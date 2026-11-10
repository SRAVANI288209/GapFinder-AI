import React from 'react';
import { GapStatus } from '@/types';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

interface TopicBadgeProps {
  status: GapStatus;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function TopicBadge({
  status,
  score,
  size = 'md',
  showIcon = true,
}: TopicBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  switch (status) {
    case 'WEAK':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
          <span>WEAK</span>
          {score !== undefined && <span className="opacity-75">({score}%)</span>}
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          <span>MEDIUM</span>
          {score !== undefined && <span className="opacity-75">({score}%)</span>}
        </span>
      );
    case 'STRONG':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          <span>STRONG</span>
          {score !== undefined && <span className="opacity-75">({score}%)</span>}
        </span>
      );
    case 'NOT_ASSESSED':
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}
        >
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-slate-400" />}
          <span>NOT ASSESSED</span>
        </span>
      );
  }
}
