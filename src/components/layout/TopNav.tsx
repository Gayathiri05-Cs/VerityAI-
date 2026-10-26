import React, { useState } from 'react';
import {
  Search,
  Plus,
  Shield,
  UserCheck,
  ChevronDown,
  Info,
  Check,
} from 'lucide-react';
import { User, NotificationItem } from '../../types';
import { DEMO_USERS } from '../../data/mockData';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { NavTab } from './Sidebar';

interface Props {
  activeTab: NavTab;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  notifications: NotificationItem[];
  onSelectApplication: (appId: string) => void;
  onOpenNewApplication: () => void;
}

export const TopNav: React.FC<Props> = ({
  activeTab,
  searchQuery,
  onSearchChange,
  currentUser,
  onUserChange,
  notifications,
  onSelectApplication,
  onOpenNewApplication,
}) => {
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'overview':
        return 'Executive Overview & Regulatory Insights';
      case 'applications':
        return 'Institutional Applications Directory';
      case 'verification':
        return 'AI Document Intelligence & Field Extraction';
      case 'compliance':
        return 'Regulatory Compliance Engine (APH 2026-27)';
      case 'risk':
        return 'Explainable Risk Scoring & Discrepancy Matrix';
      case 'queue':
        return 'Officer Review Queue & Action Center';
      case 'audit':
        return 'Immutable Audit Trail & Compliance Ledger';
      case 'settings':
        return 'Rules Configuration & System Integrations';
      default:
        return 'Verification Platform';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: View title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
              VerityAI Scrutiny Portal
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium capitalize">
              {activeTab}
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            {getTabTitle(activeTab)}
          </h1>
        </div>
      </div>

      {/* Middle: Universal Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by institution name, AICTE ID, or state..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Demo Environment Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>Demo Environment</span>
          <span
            className="cursor-help"
            title="Demonstration prototype for Smart India Hackathon. Uses illustrative synthetic records."
          >
            <Info className="w-3.5 h-3.5 text-cyan-600" />
          </span>
        </div>

        {/* Notifications */}
        <NotificationDropdown
          notifications={notifications}
          onSelectApplication={onSelectApplication}
        />

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-300"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-purple-600 font-medium capitalize">
                {currentUser.role === 'admin'
                  ? 'Administrator'
                  : currentUser.role === 'reviewer'
                  ? 'Reviewer'
                  : 'Auditor'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showRoleSelector && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRoleSelector(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10 z-50 p-2 border border-slate-100">
                <div className="p-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Switch Demo Role</p>
                  <p className="text-[11px] text-slate-500">
                    Test role-based access control and reviewer permissions
                  </p>
                </div>
                <div className="space-y-1 mt-1">
                  {DEMO_USERS.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onUserChange(user);
                          setShowRoleSelector(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-purple-50 text-purple-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-semibold">{user.name}</p>
                            <p className="text-[10px] text-slate-500 capitalize">
                              Role: <span className="font-medium text-purple-700">{user.role}</span>
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Primary Action Button */}
        {currentUser.role !== 'auditor' ? (
          <button
            onClick={onOpenNewApplication}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#5145CD] to-[#6941C6] hover:from-[#4338CA] hover:to-[#5832A8] text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Application</span>
          </button>
        ) : (
          <div
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium cursor-not-allowed"
            title="Read-only Auditor role cannot create new application records."
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Auditor (View Only)</span>
          </div>
        )}
      </div>
    </header>
  );
};
