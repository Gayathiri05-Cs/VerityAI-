import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Building,
  User,
  Calendar,
  Layers,
  FileCheck2,
  CheckCircle,
  FileQuestion,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Application, ApplicationStatus, ApplicationType, ReviewPriority } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { exportApplicationsToCSV } from '../../services/exportService';

interface Props {
  applications: Application[];
  onSelectApplication: (appId: string) => void;
  onOpenNewApplication: () => void;
  userRole: string;
}

export const ApplicationsView: React.FC<Props> = ({
  applications,
  onSelectApplication,
  onOpenNewApplication,
  userRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'id' | 'institutionName' | 'score' | 'submissionDate'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  // Filtered & Sorted Applications
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        // Search term
        const matchesSearch =
          searchTerm === '' ||
          app.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.institutionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.state.toLowerCase().includes(searchTerm.toLowerCase());

        // Status
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

        // Type
        const matchesType = typeFilter === 'all' || app.applicationType === typeFilter;

        // Priority
        const matchesPriority =
          priorityFilter === 'all' || app.riskAssessment.level === priorityFilter;

        return matchesSearch && matchesStatus && matchesType && matchesPriority;
      })
      .sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortField === 'score') {
          valA = a.riskAssessment.score;
          valB = b.riskAssessment.score;
        } else {
          valA = a[sortField];
          valB = b[sortField];
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [applications, searchTerm, statusFilter, typeFilter, priorityFilter, sortField, sortAsc]);

  const handleSort = (field: 'id' | 'institutionName' | 'score' | 'submissionDate') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for scores/dates
    }
  };

  const handleExport = () => {
    exportApplicationsToCSV(filteredApps);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Controls & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search institution name, ID, or state..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              title="Export displayed records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {userRole !== 'auditor' && (
              <button
                onClick={onOpenNewApplication}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#5145CD] to-[#6941C6] hover:from-[#4338CA] hover:to-[#5832A8] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>+ Create Application</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="action_required">Action Required</option>
            <option value="discrepancy_flagged">Discrepancy Flagged</option>
            <option value="preliminary_passed">Preliminary Passed</option>
          </select>

          {/* Type Select */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Application Types</option>
            <option value="New Institution Approval">New Institution Approval</option>
            <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
            <option value="Increase in Intake">Increase in Intake</option>
            <option value="New Program / Department">New Program / Department</option>
          </select>

          {/* Priority Select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical (80-100)</option>
            <option value="high">High (60-79)</option>
            <option value="medium">Medium (30-59)</option>
            <option value="low">Low (0-29)</option>
          </select>

          {(statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || searchTerm !== '') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setPriorityFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredApps.length}</span> of {applications.length} applications
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Application ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('institutionName')}
                  className="px-5 py-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Institution & Location</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Category</th>
                <th
                  onClick={() => handleSort('submissionDate')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Submission Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Documents</th>
                <th className="px-4 py-3.5">Status</th>
                <th
                  onClick={() => handleSort('score')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Assigned Scrutiny</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No institutional applications match the filter criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting the status or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const validDocsCount = app.documents.filter((d) => !d.isMissingPlaceholder).length;
                  const totalExpected = app.documents.length;
                  const openDiscrepancies = app.discrepancies.filter(
                    (d) => d.status !== 'resolved' && d.status !== 'false_positive'
                  ).length;

                  return (
                    <tr
                      key={app.id}
                      onClick={() => onSelectApplication(app.id)}
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-mono font-semibold text-purple-700 whitespace-nowrap">
                        {app.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {app.institutionName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-600">{app.institutionId}</span>
                          <span>•</span>
                          <span>{app.district}, {app.state}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        <span className="inline-block max-w-[140px] truncate" title={app.applicationType}>
                          {app.applicationType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {app.submissionDate}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold text-xs ${
                              validDocsCount < totalExpected ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {validDocsCount}/{totalExpected}
                          </span>
                          {openDiscrepancies > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                              {openDiscrepancies} flag{openDiscrepancies > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <RiskBadge
                          score={app.riskAssessment.score}
                          level={app.riskAssessment.level}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[110px]">{app.assignedReviewerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectApplication(app.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 group-hover:bg-purple-600 text-slate-700 group-hover:text-white text-xs font-semibold transition-colors"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
