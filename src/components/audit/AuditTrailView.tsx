import React, { useState, useMemo } from 'react';
import {
  History,
  Download,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  Calendar,
  User,
  ArrowRight,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { AuditEvent } from '../../types';
import { exportAuditEventsToCSV } from '../../services/exportService';

interface Props {
  events: AuditEvent[];
}

export const AuditTrailView: React.FC<Props> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        searchTerm === '' ||
        ev.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ev.recordIdentifier && ev.recordIdentifier.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchAction = actionFilter === 'all' || ev.action === actionFilter;
      const matchUser = userFilter === 'all' || ev.userId === userFilter;

      return matchSearch && matchAction && matchUser;
    });
  }, [events, searchTerm, actionFilter, userFilter]);

  const uniqueActions = Array.from(new Set(events.map((e) => e.action)));
  const uniqueUsers = Array.from(
    new Set(events.map((e) => JSON.stringify({ id: e.userId, name: e.userName })))
  ).map((str) => JSON.parse(str));

  const handleExport = () => {
    exportAuditEventsToCSV(filteredEvents);
  };

  const getActionColor = (action: string) => {
    if (action.includes('PRELIMINARY') || action.includes('COMPLETED') || action.includes('VERIFIED')) {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (action.includes('DISCREPANCY') || action.includes('MISMATCH') || action.includes('FAILED')) {
      return 'bg-rose-100 text-rose-800';
    }
    if (action.includes('REQUESTED') || action.includes('ACTION') || action.includes('FLAGGED')) {
      return 'bg-amber-100 text-amber-800';
    }
    if (action.includes('EXTRACTION') || action.includes('CORRECTED')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-indigo-100 text-indigo-800';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Regulatory Compliance Ledger
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Immutable Scrutiny Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Append-only record of all institutional registrations, document OCR edits, discrepancy resolutions, and preliminary committee actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Tamper-Resistant Prototype Log</span>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold">Security & Statutory Evidentiary Integrity:</strong>{' '}
          In this prototype, audit records are append-only and cannot be altered by users. For production AICTE deployment, audit events are sealed using cryptographic hashing and write-once cloud storage.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by application ID, description, or record..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="all">All Action Types</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="all">All Users / Actors</option>
              {uniqueUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex justify-between items-center pt-2 border-t border-slate-100">
          <span>
            Displaying <strong className="text-slate-800">{filteredEvents.length}</strong> immutable audit entries
          </span>
          {(searchTerm !== '' || actionFilter !== 'all' || userFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('all');
                setUserFilter('all');
              }}
              className="text-purple-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Timestamp (IST)</th>
                <th className="px-4 py-3.5">User / Official</th>
                <th className="px-4 py-3.5">Action Code</th>
                <th className="px-4 py-3.5">Application ID</th>
                <th className="px-5 py-3.5">Description & Record Evidence</th>
                <th className="px-4 py-3.5">State Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {ev.timestamp}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{ev.userName}</div>
                      <div className="text-[10px] text-slate-400 font-medium capitalize">
                        {ev.userRole}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getActionColor(ev.action)}`}>
                        {ev.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-purple-700 whitespace-nowrap">
                      {ev.applicationId}
                    </td>
                    <td className="px-5 py-3.5 max-w-md">
                      <p className="text-slate-800 font-medium">{ev.description}</p>
                      {ev.recordIdentifier && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Identifier: {ev.recordIdentifier}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600">
                      {ev.oldValue && ev.newValue ? (
                        <div className="space-y-0.5 font-mono">
                          <span className="text-slate-400 line-through truncate block max-w-xs">{ev.oldValue}</span>
                          <span className="text-emerald-700 font-semibold truncate block max-w-xs">{ev.newValue}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No transition</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
