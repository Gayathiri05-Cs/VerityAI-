import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Eye,
  FileText,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  Info,
} from 'lucide-react';
import { Application, Discrepancy, User } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StorageService } from '../../services/storageService';

interface Props {
  applications: Application[];
  currentUser: User;
  onSelectApplication: (id: string) => void;
}

export const RiskAnomaliesView: React.FC<Props> = ({
  applications,
  currentUser,
  onSelectApplication,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<{
    disc: Discrepancy;
    app: Application;
  } | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Collect all discrepancies across all applications
  const allDiscrepancies: { disc: Discrepancy; app: Application }[] = [];
  applications.forEach((app) => {
    app.discrepancies.forEach((disc) => {
      allDiscrepancies.push({ disc, app });
    });
  });

  const filtered = allDiscrepancies.filter((item) => {
    const matchSev = severityFilter === 'all' || item.disc.severity === severityFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' && (item.disc.status === 'open' || item.disc.status === 'confirmed' || item.disc.status === 'needs_evidence')) ||
      item.disc.status === statusFilter;
    return matchSev && matchStatus;
  });

  const handleResolveAction = (newStatus: Discrepancy['status']) => {
    if (!selectedDiscrepancy) return;
    if (!resolutionNote.trim()) {
      alert('Please enter a mandatory explanation note for the audit ledger before resolving.');
      return;
    }

    StorageService.resolveDiscrepancy(
      selectedDiscrepancy.app.id,
      selectedDiscrepancy.disc.id,
      newStatus,
      resolutionNote,
      currentUser.name
    );

    setSelectedDiscrepancy(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
              Discrepancy & Anomaly Matrix
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Cross-Document Mismatches & Visual Tampering Inspection
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Identifies entity name deviations, registration ID digit mismatches, and visual anomalies.
            Assists scrutiny officers; does not make autonomous accusations of fraud.
          </p>
        </div>

        {/* Forensic Disclaimer */}
        <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 max-w-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] leading-tight">
            Advanced forensic stamp/signature analysis unavailable in demo mode. Physical verification mandatory.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Filter Discrepancies:</span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="open">Active (Open & Needs Evidence)</option>
            <option value="all">All Records</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">Dismissed (False Positive)</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>

        <span className="text-slate-500">
          Showing <strong className="text-slate-800">{filtered.length}</strong> flagged issues
        </span>
      </div>

      {/* Discrepancies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(({ disc, app }) => {
          return (
            <div
              key={disc.id}
              className={`p-4 rounded-xl border bg-white shadow-xs space-y-3 transition-all ${
                disc.severity === 'critical'
                  ? 'border-rose-200 hover:border-rose-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        disc.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : disc.severity === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {disc.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{disc.title}</span>
                  </div>
                  <p className="text-[11px] text-purple-700 font-semibold cursor-pointer hover:underline" onClick={() => onSelectApplication(app.id)}>
                    {app.institutionName} ({app.id})
                  </p>
                </div>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                    disc.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : disc.status === 'false_positive'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {disc.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{disc.description}</p>

              {/* Side by side comparison */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">
                    Document Extracted
                  </span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {disc.sourceDocName}
                  </span>
                  <p className="font-mono font-bold text-slate-900 text-xs mt-1 truncate">
                    {disc.sourceValue}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-200">
                  <span className="text-[10px] text-purple-600 font-bold uppercase block truncate">
                    Application Baseline
                  </span>
                  <span className="text-[10px] text-purple-500 truncate block">
                    {disc.targetDocName || 'Master Profile'}
                  </span>
                  <p className="font-mono font-bold text-purple-900 text-xs mt-1 truncate">
                    {disc.targetValue || 'Mandate'}
                  </p>
                </div>
              </div>

              {/* Resolution Action */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  Flagged: {disc.createdAt}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDiscrepancy({ disc, app })}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
                  >
                    Action Discrepancy
                  </button>
                  <button
                    onClick={() => onSelectApplication(app.id)}
                    className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolution Decision Modal */}
      {selectedDiscrepancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-purple-600 font-bold">
                  {selectedDiscrepancy.app.id}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Record Resolution Finding: {selectedDiscrepancy.disc.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              {selectedDiscrepancy.disc.description}
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Mandatory Reviewer Finding Note *
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Explain the regulatory rationale for this decision (e.g., 'Clerical typo verified with registered university gazette')..."
                rows={3}
                className="w-full p-2.5 border border-purple-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleResolveAction('false_positive')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Dismiss (False Positive)
              </button>
              <button
                onClick={() => handleResolveAction('needs_evidence')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Demand Clarification
              </button>
              <button
                onClick={() => handleResolveAction('confirmed')}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Confirm Discrepancy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
