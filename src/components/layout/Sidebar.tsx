import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileCheck2,
  SlidersHorizontal,
  AlertTriangle,
  ListTodo,
  History,
  Settings,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';

export type NavTab =
  | 'overview'
  | 'applications'
  | 'verification'
  | 'compliance'
  | 'risk'
  | 'queue'
  | 'audit'
  | 'settings';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  queueCount: number;
  anomaliesCount: number;
  currentUser: User;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  queueCount,
  anomaliesCount,
  currentUser,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'applications', label: 'Applications', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'verification', label: 'Document Verification', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'compliance', label: 'Compliance Center', icon: <SlidersHorizontal className="w-4 h-4" /> },
    {
      id: 'risk',
      label: 'Risk & Anomalies',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: anomaliesCount > 0 ? anomaliesCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'queue',
      label: 'Review Queue',
      icon: <ListTodo className="w-4 h-4" />,
      badge: queueCount > 0 ? queueCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-900 font-bold',
    },
    { id: 'audit', label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-[#10152F] text-slate-200 flex flex-col shrink-0 border-r border-indigo-950/60 shadow-xl select-none min-h-screen">
      {/* Branding Header */}
      <div className="p-5 border-b border-indigo-900/40 bg-gradient-to-b from-[#141A3A] to-[#10152F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6941C6] via-[#5145CD] to-[#22D3EE] flex items-center justify-center shadow-lg shadow-indigo-900/50 ring-1 ring-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white font-sans">
                Verity<span className="text-[#22D3EE]">AI</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                SIH26261
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
              AICTE Validation Platform
            </p>
          </div>
        </div>
      </div>

      {/* Trust & Advisory Pill */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-indigo-950/70 border border-indigo-800/40 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
        <span className="text-[11px] text-indigo-200 font-medium leading-snug">
          Assisting AICTE Officials • Non-Autonomous Decisions
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workspaces
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-[#5145CD] to-[#6941C6] text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-colors ${isActive ? 'text-[#22D3EE]' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Profile Box at Bottom */}
      <div className="p-4 border-t border-indigo-900/40 bg-[#0C1024]">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full ring-2 ring-indigo-500/40 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${currentUser.role === 'admin' ? 'bg-purple-400' : currentUser.role === 'reviewer' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
              <p className="text-[11px] text-slate-400 capitalize truncate">
                {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'reviewer' ? 'Reviewer' : 'Auditor'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
          <Building2 className="w-3 h-3 text-slate-400" />
          <span className="truncate">{currentUser.department}</span>
        </div>
      </div>
    </aside>
  );
};
