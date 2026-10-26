import React from 'react';
import { ApplicationStatus, DocumentStatus, ComplianceCheckOutcome } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Clock, FileQuestion, ShieldAlert } from 'lucide-react';

interface Props {
  status: ApplicationStatus | DocumentStatus | ComplianceCheckOutcome;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const py = size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-xs font-medium';
  const px = size === 'sm' ? 'px-2' : 'px-2.5';

  switch (status) {
    case 'preliminary_passed':
    case 'verified':
    case 'passed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium ${px} ${py}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{status === 'preliminary_passed' ? 'Prelim Passed' : status === 'verified' ? 'Verified' : 'Passed'}</span>
        </span>
      );

    case 'action_required':
    case 'review_needed':
    case 'warning':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 font-medium ${px} ${py}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{status === 'action_required' ? 'Action Required' : status === 'review_needed' ? 'Review Needed' : 'Warning'}</span>
        </span>
      );

    case 'discrepancy_flagged':
    case 'discrepancy':
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-medium ${px} ${py}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{status === 'discrepancy_flagged' ? 'Discrepancy' : status === 'discrepancy' ? 'Discrepancy' : 'Failed'}</span>
        </span>
      );

    case 'expired':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-800 border border-red-300 font-medium ${px} ${py}`}>
          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>Expired</span>
        </span>
      );

    case 'missing':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-medium ${px} ${py}`}>
          <FileQuestion className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Missing</span>
        </span>
      );

    case 'under_review':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium ${px} ${py}`}>
          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Under Review</span>
        </span>
      );

    case 'submitted':
    case 'pending':
    case 'extracting':
    case 'not_evaluated':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/80 font-medium ${px} ${py}`}>
          <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <span>{status === 'submitted' ? 'Submitted' : status === 'extracting' ? 'Extracting...' : status === 'not_evaluated' ? 'Not Evaluated' : 'Pending'}</span>
        </span>
      );
  }
};
