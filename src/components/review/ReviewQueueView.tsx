import React, { useState } from 'react';
import {
  ListTodo,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  UserCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Application, User } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { StorageService } from '../../services/storageService';

interface Props {
  applications: Application[];
  currentUser: User;
  onSelectApplication: (id: string) => void;
}

export const ReviewQueueView: React.FC<Props> = ({
  applications,
  currentUser,
  onSelectApplication,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [reviewerFilter, setReviewerFilter] = useState<string>('all');
  const [commentModalApp, setCommentModalApp] = useState<Application | null>(null);
  const [commentText, setCommentText] = useState('');

  // Sort queue by priority score (descending)
  const queue = [...applications]
    .filter((a) => {
      const matchPri = priorityFilter === 'all' || a.riskAssessment.level === priorityFilter;
      const matchRev = reviewerFilter === 'all' || a.assignedReviewerId === reviewerFilter;
      return matchPri && matchRev;
    })
    .sort((a, b) => b.riskAssessment.score - a.riskAssessment.score);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentModalApp || !commentText.trim()) return;
    StorageService.addReviewComment(commentModalApp.id, commentText);
    setCommentModalApp(null);
    setCommentText('');
  };

  const handleQuickStatus = (appId: string, newStatus: Application['status']) => {
    StorageService.updateApplication(appId, { status: newStatus });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Scrutiny Queue
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Prioritized Institutional Review Queue
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cases ordered by explainable risk index. Highest risk signals, expiry lapses, and discrepancies surfaced first.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical (80-100)</option>
            <option value="high">High (60-79)</option>
            <option value="medium">Medium (30-59)</option>
            <option value="low">Low (0-29)</option>
          </select>

          <select
            value={reviewerFilter}
            onChange={(e) => setReviewerFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Scrutiny Officers</option>
            {StorageService.getAllUsers().map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Queue Cards List */}
      <div className="space-y-3.5">
        {queue.map((app, index) => {
          const primarySignals = app.riskAssessment.breakdown.slice(0, 2);
          const openDiscrepancies = app.discrepancies.filter(
            (d) => d.status === 'open' || d.status === 'confirmed' || d.status === 'needs_evidence'
          );

          return (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-purple-300 transition-all p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-700">
                        {app.id}
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {app.applicationType}
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-mono">
                        AY {app.academicYear}
                      </span>
                    </div>
                    <h3
                      onClick={() => onSelectApplication(app.id)}
                      className="text-sm font-bold text-slate-900 hover:text-purple-700 transition-colors cursor-pointer mt-0.5"
                    >
                      {app.institutionName}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Permanent ID: {app.institutionId} • {app.district}, {app.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <StatusBadge status={app.status} size="sm" />
                  <RiskBadge
                    score={app.riskAssessment.score}
                    level={app.riskAssessment.level}
                  />
                </div>
              </div>

              {/* Signals summary */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Why this case requires review:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {primarySignals.map((sig) => (
                    <div key={sig.id} className="flex items-start gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 mt-0.5 ${
                          sig.impactScore >= 30
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        +{sig.impactScore}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          {sig.title}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {sig.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span>Assigned: <strong className="text-slate-800">{app.assignedReviewerName}</strong></span>
                  <span>•</span>
                  <span>Discrepancies: <strong className="text-rose-600">{openDiscrepancies.length}</strong></span>
                  <span>•</span>
                  <span>Notes: <strong className="text-slate-700">{app.comments.length}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCommentModalApp(app)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Add Note</span>
                  </button>

                  {currentUser.role !== 'auditor' && app.status !== 'under_review' && (
                    <button
                      onClick={() => handleQuickStatus(app.id, 'under_review')}
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold"
                    >
                      In Review
                    </button>
                  )}

                  {currentUser.role !== 'auditor' && app.status !== 'action_required' && (
                    <button
                      onClick={() => handleQuickStatus(app.id, 'action_required')}
                      className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold"
                    >
                      Demand Evidence
                    </button>
                  )}

                  <button
                    onClick={() => onSelectApplication(app.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#5145CD] to-[#6941C6] hover:from-[#4338CA] hover:to-[#5832A8] text-white font-semibold flex items-center gap-1 shadow-xs"
                  >
                    <span>Inspect Dossier</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note Modal */}
      {commentModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                Add Reviewer Note for {commentModalApp.institutionName}
              </h3>
              <button
                onClick={() => setCommentModalApp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostComment} className="space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter internal scrutiny observation..."
                rows={3}
                className="w-full p-2.5 border border-purple-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCommentModalApp(null)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-50"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
