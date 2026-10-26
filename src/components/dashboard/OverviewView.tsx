import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileX2,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { Application } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface Props {
  applications: Application[];
  onSelectApplication: (appId: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenNewApplication: () => void;
}

export const OverviewView: React.FC<Props> = ({
  applications,
  onSelectApplication,
  onNavigateTab,
  onOpenNewApplication,
}) => {
  // Live KPI Calculations
  const totalApps = applications.length;
  const pendingReview = applications.filter(
    (a) => a.status === 'submitted' || a.status === 'under_review'
  ).length;
  const passedPrelim = applications.filter((a) => a.status === 'preliminary_passed').length;
  const withDiscrepancies = applications.filter(
    (a) => a.discrepancies.some((d) => d.status !== 'resolved' && d.status !== 'false_positive')
  ).length;

  let missingOrExpiredCount = 0;
  applications.forEach((a) => {
    a.documents.forEach((d) => {
      if (d.status === 'missing' || d.status === 'expired' || d.isMissingPlaceholder) {
        missingOrExpiredCount++;
      }
    });
  });

  const highPriorityCount = applications.filter(
    (a) => a.riskAssessment.level === 'critical' || a.riskAssessment.level === 'high'
  ).length;

  // Chart Data: Status Distribution
  const statusData = [
    { name: 'Prelim Passed', value: passedPrelim, color: '#10B981' },
    { name: 'Under Review', value: applications.filter((a) => a.status === 'under_review').length, color: '#6941C6' },
    { name: 'Action Required', value: applications.filter((a) => a.status === 'action_required').length, color: '#F59E0B' },
    { name: 'Discrepancy Flagged', value: applications.filter((a) => a.status === 'discrepancy_flagged').length, color: '#F05252' },
    { name: 'Submitted (New)', value: applications.filter((a) => a.status === 'submitted').length, color: '#22D3EE' },
  ].filter((item) => item.value > 0);

  // Chart Data: Risk Priority Levels
  const riskPriorityData = [
    { name: 'Low (0-29)', count: applications.filter((a) => a.riskAssessment.level === 'low').length, fill: '#10B981' },
    { name: 'Medium (30-59)', count: applications.filter((a) => a.riskAssessment.level === 'medium').length, fill: '#5145CD' },
    { name: 'High (60-79)', count: applications.filter((a) => a.riskAssessment.level === 'high').length, fill: '#F59E0B' },
    { name: 'Critical (80-100)', count: applications.filter((a) => a.riskAssessment.level === 'critical').length, fill: '#F05252' },
  ];

  // Chart Data: Compliance Rule Outcomes
  let totalPassedRules = 0;
  let totalWarningRules = 0;
  let totalFailedRules = 0;

  applications.forEach((a) => {
    a.complianceChecks.forEach((c) => {
      if (c.outcome === 'passed') totalPassedRules++;
      else if (c.outcome === 'warning') totalWarningRules++;
      else if (c.outcome === 'failed') totalFailedRules++;
    });
  });

  const complianceOutcomeData = [
    { category: 'Mandatory Rules', Passed: totalPassedRules, Warnings: totalWarningRules, Failed: totalFailedRules },
  ];

  // Top Critical / High Priority Queue Items
  const urgentQueue = [...applications]
    .sort((a, b) => b.riskAssessment.score - a.riskAssessment.score)
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10152F] via-[#2D1B69] to-[#5145CD] p-7 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Smart India Hackathon • SIH26261 Institutional Validation</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Intelligent Verification. Transparent Decisions.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Assisting AICTE scrutiny officers with automated cross-document verification,
              APH 2026 regulatory compliance checks, explainable review scoring, and tamper-evident audit trails.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('queue')}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Open Review Queue</span>
              <ChevronRight className="w-4 h-4 text-purple-700" />
            </button>
            <button
              onClick={() => onNavigateTab('verification')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-sm border border-white/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-cyan-300" />
              <span>Document Intelligence</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalApps}</span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Live
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">AY 2026-27 Intake</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{pendingReview}</span>
            <span className="text-[11px] font-medium text-purple-600">Active</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Awaiting officer sign-off</p>
        </div>

        {/* Passed Preliminary */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Prelim Passed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">{passedPrelim}</span>
            <span className="text-[11px] font-medium text-emerald-600">Compliant</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Ready for Scrutiny Committee</p>
        </div>

        {/* With Discrepancies */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Discrepancies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600">{withDiscrepancies}</span>
            <span className="text-[11px] font-medium text-rose-600">Mismatch</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Cross-document flags</p>
        </div>

        {/* Missing or Expired */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Missing / Expired</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileX2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">{missingOrExpiredCount}</span>
            <span className="text-[11px] font-medium text-amber-600">Certificates</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Safety & lease deeds</p>
        </div>

        {/* High Priority Reviews */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">High Risk Priority</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-700">{highPriorityCount}</span>
            <span className="text-[11px] font-medium text-red-600">Urgent</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Score ≥ 60/100</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Status Distribution</h3>
              <p className="text-[11px] text-slate-600">Real-time status breakdown</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} applications`, name]}
                  contentStyle={{ backgroundColor: '#10152F', borderColor: '#312E81', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-slate-600 truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Priority Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Review Priority Distribution</h3>
              <p className="text-[11px] text-slate-600">Calculated from explainable risk signals</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskPriorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Cases`, 'Applications']}
                  contentStyle={{ backgroundColor: '#10152F', borderColor: '#312E81', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskPriorityData.map((entry, index) => (
                    <Cell key={`cell-risk-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Critical & High: {highPriorityCount} applications</span>
            <span className="text-purple-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab('risk')}>
              View Matrix →
            </span>
          </div>
        </div>

        {/* Regulatory Check Outcomes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Compliance Check Outcomes</h3>
              <p className="text-[11px] text-slate-600">Aggregated across all evaluated rules</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceOutcomeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#10152F', borderColor: '#312E81', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Passed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Warnings" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="#F05252" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex justify-between">
            <span>Passed: {totalPassedRules} • Warnings: {totalWarningRules} • Failed: {totalFailedRules}</span>
            <span className="text-purple-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab('compliance')}>
              Rule Engine →
            </span>
          </div>
        </div>
      </div>

      {/* Priority Action Center Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Highest-Priority Scrutiny Queue</h3>
            <p className="text-xs text-slate-600">
              Applications prioritized based on missing certificates, date lapses, and cross-document mismatches.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('queue')}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>Full Review Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-5 py-3">Institution & ID</th>
                <th className="px-4 py-3">Application Type</th>
                <th className="px-4 py-3">Preliminary Status</th>
                <th className="px-4 py-3">Review Priority</th>
                <th className="px-4 py-3">Primary Inspection Signal</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {urgentQueue.map((app) => {
                const primarySignal = app.riskAssessment.breakdown[0]?.title || 'Routine verification';
                return (
                  <tr
                    key={app.id}
                    className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                    onClick={() => onSelectApplication(app.id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                        {app.institutionName}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{app.institutionId}</span>
                        <span>•</span>
                        <span>{app.state}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {app.applicationType}
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
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                      <span className="font-medium text-slate-800">{primarySignal}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectApplication(app.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-purple-600 text-slate-700 group-hover:text-white text-xs font-semibold transition-colors"
                      >
                        <span>Examine</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
